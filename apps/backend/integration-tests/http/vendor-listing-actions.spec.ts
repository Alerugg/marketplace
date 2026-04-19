import jwt from 'jsonwebtoken'

import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

type SellerAuthContext = {
  token: string
  sellerId: string
}

const defaultListingPayload = {
  print_id: 'print_001',
  price_amount: 199.99,
  currency_code: 'usd',
  condition_code: 'near_mint',
  quantity_available: 1,
  status: 'draft',
  seller_note: 'initial note',
  photos: ['https://example.com/a.jpg'],
  location_country: 'US',
  shipping_profile_id: 'sp_123'
}

jest.setTimeout(90 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const createSellerAuthContext = async (
      email: string,
      sellerName: string
    ): Promise<SellerAuthContext> => {
      const container = getContainer()
      const sellerService = container.resolve<any>('seller')
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const seller = await sellerService.createSellers({
        name: sellerName,
        handle: `handle_${unique}`
      })

      const member = await sellerService.createMembers({
        name: `${sellerName} Owner`,
        email,
        seller_id: seller.id
      })

      const token = jwt.sign(
        {
          actor_id: member.id,
          actor_type: 'seller',
          auth_identity_id: `auth_${unique}`
        },
        process.env.JWT_SECRET || 'supersecret'
      )

      return {
        token,
        sellerId: seller.id
      }
    }

    describe('Vendor Listing Actions API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext
      let sellerAListingId: string
      let sellerBListingId: string

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        sellerA = await createSellerAuthContext(
          `seller-a-${uniqueSeed}@example.com`,
          `Seller A ${uniqueSeed}`
        )
        sellerB = await createSellerAuthContext(
          `seller-b-${uniqueSeed}@example.com`,
          `Seller B ${uniqueSeed}`
        )

        const sellerAListingResponse = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_a_${uniqueSeed}`
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        sellerAListingId = sellerAListingResponse.data.listing.id

        const sellerBListingResponse = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_b_${uniqueSeed}`
          },
          {
            headers: {
              Authorization: `Bearer ${sellerB.token}`
            }
          }
        )

        sellerBListingId = sellerBListingResponse.data.listing.id
      })

      it('activates own valid listing', async () => {
        const response = await api.post(
          `/vendor/listings/${sellerAListingId}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.status).toBe('active')
      })

      it('rejects activate when quantity_available is 0', async () => {
        const createResponse = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_zero_${Date.now()}`,
            quantity_available: 0,
            status: 'draft'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        const response = await api.post(
          `/vendor/listings/${createResponse.data.listing.id}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
        expect(response.data.message).toContain(
          'active listings must have quantity_available greater than 0'
        )
      })

      it('pauses own listing', async () => {
        await api.post(
          `/vendor/listings/${sellerAListingId}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        const response = await api.post(
          `/vendor/listings/${sellerAListingId}/pause`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.status).toBe('paused')
      })

      it('rejects acting on another seller listing', async () => {
        const response = await api.post(
          `/vendor/listings/${sellerBListingId}/archive`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(403)
      })

      it('archives own listing', async () => {
        const response = await api.post(
          `/vendor/listings/${sellerAListingId}/archive`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.status).toBe('archived')
      })

      it('rejects reactivating archived listing', async () => {
        await api.post(
          `/vendor/listings/${sellerAListingId}/archive`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        const response = await api.post(
          `/vendor/listings/${sellerAListingId}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
        expect(response.data.message).toContain(
          'invalid status transition from archived to active'
        )
      })

      it('sell sets quantity_available to 0 and status sold', async () => {
        await api.post(
          `/vendor/listings/${sellerAListingId}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        const response = await api.post(
          `/vendor/listings/${sellerAListingId}/sell`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.status).toBe('sold')
        expect(response.data.listing.quantity_available).toBe(0)
      })

      it('requires authentication on all action routes', async () => {
        const actionPaths = ['activate', 'pause', 'archive', 'sell']

        for (const actionPath of actionPaths) {
          const response = await api.post(
            `/vendor/listings/${sellerAListingId}/${actionPath}`,
            {},
            {
              validateStatus: () => true
            }
          )

          expect(response.status).toBe(401)
        }
      })
    })
  }
})