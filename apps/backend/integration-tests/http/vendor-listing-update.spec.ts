
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

    const createListing = async (
      token: string,
      overrides: Record<string, any> = {}
    ) => {
      return api.post(
        '/vendor/listings',
        {
          ...defaultListingPayload,
          ...overrides
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
    }

    describe('Vendor Listing Update API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext

      let sellerADraftListingId: string
      let sellerAActiveListingId: string
      let sellerBListingId: string
      let sellerADraftPrintId: string

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        sellerA = await createSellerAuthContext(
          `seller-a-update-${uniqueSeed}@example.com`,
          `Seller A Update ${uniqueSeed}`
        )

        sellerB = await createSellerAuthContext(
          `seller-b-update-${uniqueSeed}@example.com`,
          `Seller B Update ${uniqueSeed}`
        )

        sellerADraftPrintId = `print_a_draft_${uniqueSeed}`

        const sellerADraftResponse = await createListing(sellerA.token, {
          print_id: sellerADraftPrintId,
          status: 'draft',
          quantity_available: 2,
          seller_note: 'draft before update'
        })

        sellerADraftListingId = sellerADraftResponse.data.listing.id

        const sellerAActiveResponse = await createListing(sellerA.token, {
          print_id: `print_a_active_${uniqueSeed}`,
          status: 'active',
          quantity_available: 2,
          seller_note: 'active before invalid update'
        })

        sellerAActiveListingId = sellerAActiveResponse.data.listing.id

        const sellerBResponse = await createListing(sellerB.token, {
          print_id: `print_b_${uniqueSeed}`,
          status: 'draft',
          quantity_available: 1
        })

        sellerBListingId = sellerBResponse.data.listing.id
      })

      it('updates allowed mutable fields on own listing', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
          {
            price_amount: 249.99,
            currency_code: 'eur',
            condition_code: 'light_played',
            quantity_available: 4,
            seller_note: 'updated note',
            photos: ['https://example.com/updated.jpg'],
            location_country: 'ES',
            shipping_profile_id: 'sp_456'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.id).toBe(sellerADraftListingId)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
        expect(response.data.listing.print_id).toBe(sellerADraftPrintId)

        expect(response.data.listing.price_amount).toBe(249.99)
        expect(response.data.listing.currency_code).toBe('eur')
        expect(response.data.listing.condition_code).toBe('light_played')
        expect(response.data.listing.quantity_available).toBe(4)
        expect(response.data.listing.seller_note).toBe('updated note')
        expect(response.data.listing.photos).toEqual([
          'https://example.com/updated.jpg'
        ])
        expect(response.data.listing.location_country).toBe('ES')
        expect(response.data.listing.shipping_profile_id).toBe('sp_456')
      })

      it('rejects updating print_id', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
          {
            print_id: 'print_should_not_change'
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

      it('rejects seller_id in update request body', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
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

      it('rejects non-positive price_amount', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
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

      it('rejects negative quantity_available', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
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

      it('rejects updating an active listing to quantity_available 0 without changing status', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerAActiveListingId}`,
          {
            quantity_available: 0
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

      it('rejects updating a listing that belongs to another seller', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerBListingId}`,
          {
            seller_note: 'malicious update attempt'
          },
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect([403, 404]).toContain(response.status)
      })

      it('requires authentication on update route', async () => {
        const response = await api.patch(
          `/vendor/listings/${sellerADraftListingId}`,
          {
            seller_note: 'should fail'
          },
          {
            validateStatus: () => true
          }
        )

        expect([401, 403]).toContain(response.status)
      })
    })
  }
})