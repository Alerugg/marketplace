import jwt from 'jsonwebtoken'

import { MedusaError } from '@medusajs/framework/utils'
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

    describe('Vendor Listings API', () => {
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

      it('creates listing without seller_id in request body and injects authenticated seller_id server-side', async () => {
        const response = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_create_${Date.now()}`
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(201)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
      })

      it('rejects non-positive price_amount when creating listing', async () => {
        const response = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_bad_price_${Date.now()}`,
            price_amount: 0
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects negative quantity_available when creating listing', async () => {
        const response = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_bad_qty_${Date.now()}`,
            quantity_available: -1
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects invalid status when creating listing', async () => {
        const response = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_bad_status_${Date.now()}`,
            status: 'invalid_status'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects seller_id in create request body', async () => {
        const response = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_reject_seller_id_${Date.now()}`,
            seller_id: sellerB.sellerId
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('lists only listings for the authenticated seller', async () => {
        const response = await api.get('/vendor/listings', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          }
        })

        expect(response.status).toBe(200)
        expect(response.data.listings.length).toBeGreaterThan(0)
        expect(
          response.data.listings.every(
            (listing: any) => listing.seller_id === sellerA.sellerId
          )
        ).toBe(true)
        expect(
          response.data.listings.some(
            (listing: any) => listing.id === sellerBListingId
          )
        ).toBe(false)
      })

      it('retrieves own listing', async () => {
        const response = await api.get(`/vendor/listings/${sellerAListingId}`, {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          }
        })

        expect(response.status).toBe(200)
        expect(response.data.listing.id).toBe(sellerAListingId)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
      })

      it('patches own listing using allowed fields', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            status: 'paused',
            seller_note: 'updated note'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.status).toBe('paused')
        expect(response.data.listing.seller_note).toBe('updated note')
      })

      it('rejects unknown fields in patch request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            unexpected_field: 'nope'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('returns 404 for a missing listing', async () => {
        const response = await api.get('/vendor/listings/listing_missing_123', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          },
          validateStatus: () => true
        })

        expect(response.status).toBe(404)
      })

      it('filters listings by status for the authenticated seller', async () => {
        await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_active_${Date.now()}`,
            status: 'active'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        const response = await api.get('/vendor/listings?status=active', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          }
        })

        expect(response.status).toBe(200)
        expect(response.data.listings.length).toBeGreaterThan(0)
        expect(
          response.data.listings.every(
            (listing: any) => listing.seller_id === sellerA.sellerId
          )
        ).toBe(true)
        expect(
          response.data.listings.every(
            (listing: any) => listing.status === 'active'
          )
        ).toBe(true)
        expect(
          response.data.listings.some(
            (listing: any) => listing.id === sellerBListingId
          )
        ).toBe(false)
      })

      it('rejects non-positive price_amount in patch request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            price_amount: 0
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects negative quantity_available in patch request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            quantity_available: -1
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects invalid status in patch request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            status: 'invalid_status'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects invalid status in list filter', async () => {
        const response = await api.get(
          '/vendor/listings?status=invalid_status',
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('ignores seller_id in list filter and still scopes to authenticated seller', async () => {
        const response = await api.get(
          '/vendor/listings?seller_id=seller_other',
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listings.length).toBeGreaterThan(0)
        expect(
          response.data.listings.every(
            (listing: any) => listing.seller_id === sellerA.sellerId
          )
        ).toBe(true)
      })

      it('returns an empty list when authenticated seller has no listings for the requested status', async () => {
        const response = await api.get('/vendor/listings?status=sold', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          }
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.listings)).toBe(true)
        expect(response.data.listings.length).toBe(0)
      })

      it('requires authentication for vendor listings routes', async () => {
        const listResponse = await api.get('/vendor/listings', {
          validateStatus: () => true
        })

        const detailResponse = await api.get(
          `/vendor/listings/${sellerAListingId}`,
          {
            validateStatus: () => true
          }
        )

        const createResponse = await api.post(
          '/vendor/listings',
          {
            ...defaultListingPayload,
            print_id: `print_no_auth_${Date.now()}`
          },
          {
            validateStatus: () => true
          }
        )

        const patchResponse = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            status: 'paused'
          },
          {
            validateStatus: () => true
          }
        )

        expect([401, 403]).toContain(listResponse.status)
        expect([401, 403]).toContain(detailResponse.status)
        expect([401, 403]).toContain(createResponse.status)
        expect([401, 403]).toContain(patchResponse.status)
      })

      it('rejects seller_id in patch request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAListingId}`,
          {
            seller_id: sellerB.sellerId
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
      })

      it('rejects access to another seller listing if seller scoping middleware is active', async () => {
        const getResponse = await api.get(
          `/vendor/listings/${sellerBListingId}`,
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect([403, 404]).toContain(getResponse.status)

        const patchResponse = await api.patch(
          `/vendor/listings/${sellerBListingId}`,
          {
            status: 'archived'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect([403, 404]).toContain(patchResponse.status)
      })

      it('rejects invalid listing data when creating directly via the listing service', async () => {
        const listingModuleService = getContainer().resolve<any>('listing')

        await expect(
          listingModuleService.createListings({
            ...defaultListingPayload,
            print_id: `print_domain_invalid_create_${Date.now()}`,
            seller_id: sellerA.sellerId,
            price_amount: 0
          } as any)
        ).rejects.toMatchObject({
          type: MedusaError.Types.INVALID_DATA,
          message: expect.stringContaining(
            'price_amount must be greater than 0'
          )
        })
      })

      it('rejects invalid listing data when updating directly via the listing service', async () => {
        const listingModuleService = getContainer().resolve<any>('listing')

        await expect(
          listingModuleService.updateListings({
            id: sellerAListingId,
            quantity_available: -1
          } as any)
        ).rejects.toMatchObject({
          type: MedusaError.Types.INVALID_DATA,
          message: expect.stringContaining(
            'quantity_available must be greater than or equal to 0'
          )
        })
      })
    })
  }
})
