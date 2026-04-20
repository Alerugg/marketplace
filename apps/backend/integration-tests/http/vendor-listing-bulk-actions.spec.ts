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
  shipping_profile_id: 'sp_123',
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
        handle: `handle_${unique}`,
      })

      const member = await sellerService.createMembers({
        name: `${sellerName} Owner`,
        email,
        seller_id: seller.id,
      })

      const token = jwt.sign(
        {
          actor_id: member.id,
          actor_type: 'seller',
          auth_identity_id: `auth_${unique}`,
        },
        process.env.JWT_SECRET || 'supersecret'
      )

      return {
        token,
        sellerId: seller.id,
      }
    }

    describe('Vendor Listing Bulk Actions API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext

      let sellerAListingId1: string
      let sellerAListingId2: string
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

        const sellerAListingResponse1 = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_a1_${uniqueSeed}`,
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        sellerAListingId1 = sellerAListingResponse1.data.listing.id

        const sellerAListingResponse2 = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_a2_${uniqueSeed}`,
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        sellerAListingId2 = sellerAListingResponse2.data.listing.id

        const sellerBListingResponse = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_b_${uniqueSeed}`,
          },
          {
            headers: {
              Authorization: `Bearer ${sellerB.token}`,
            },
          }
        )

        sellerBListingId = sellerBListingResponse.data.listing.id
      })

      it('bulk pauses only the authenticated seller listings', async () => {
        await api.post(
          `/vendor/listings/${sellerAListingId1}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        await api.post(
          `/vendor/listings/${sellerAListingId2}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [sellerAListingId1, sellerAListingId2],
            action: 'pause',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.count).toBe(2)
        expect(response.data.listings).toHaveLength(2)

        const ids = response.data.listings.map((listing: any) => listing.id).sort()
        expect(ids).toEqual([sellerAListingId1, sellerAListingId2].sort())

        for (const listing of response.data.listings) {
          expect(listing.status).toBe('paused')
        }
      })

      it('bulk archives authenticated seller listings', async () => {
        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [sellerAListingId1, sellerAListingId2],
            action: 'archive',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.count).toBe(2)
        expect(response.data.listings).toHaveLength(2)

        const ids = response.data.listings.map((listing: any) => listing.id).sort()
        expect(ids).toEqual([sellerAListingId1, sellerAListingId2].sort())

        for (const listing of response.data.listings) {
          expect(listing.status).toBe('archived')
        }
      })

      it('bulk activates paused listings with stock', async () => {
        await api.post(
          `/vendor/listings/${sellerAListingId1}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        await api.post(
          `/vendor/listings/${sellerAListingId2}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        await api.post(
          `/vendor/listings/${sellerAListingId1}/pause`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        await api.post(
          `/vendor/listings/${sellerAListingId2}/pause`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [sellerAListingId1, sellerAListingId2],
            action: 'activate',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.count).toBe(2)
        expect(response.data.listings).toHaveLength(2)

        const ids = response.data.listings.map((listing: any) => listing.id).sort()
        expect(ids).toEqual([sellerAListingId1, sellerAListingId2].sort())

        for (const listing of response.data.listings) {
          expect(listing.status).toBe('active')
        }
      })

      it('rejects listing ids that do not belong to the authenticated seller', async () => {
        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [sellerAListingId1, sellerBListingId],
            action: 'archive',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
            validateStatus: () => true,
          }
        )

        expect([403, 404]).toContain(response.status)
      })

      it('rejects an invalid action', async () => {
        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [sellerAListingId1, sellerAListingId2],
            action: 'invalid-action',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
            validateStatus: () => true,
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects an empty listing_ids array', async () => {
        const response = await api.post(
          '/vendor/listings/actions',
          {
            listing_ids: [],
            action: 'archive',
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`,
            },
            validateStatus: () => true,
          }
        )

        expect(response.status).toBe(400)
      })
    })
  },
})