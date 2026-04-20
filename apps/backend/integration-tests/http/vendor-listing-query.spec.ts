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

    describe('Vendor Listing Query API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext

      let sellerADraftListingId: string
      let sellerAActiveListingId: string
      let sellerBListingId: string

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        sellerA = await createSellerAuthContext(
          `seller-a-query-${uniqueSeed}@example.com`,
          `Seller A Query ${uniqueSeed}`
        )

        sellerB = await createSellerAuthContext(
          `seller-b-query-${uniqueSeed}@example.com`,
          `Seller B Query ${uniqueSeed}`
        )

        const sellerADraftResponse = await createListing(sellerA.token, {
          print_id: `print_a_draft_${uniqueSeed}`,
          status: 'draft',
          quantity_available: 2,
          seller_note: 'seller A draft'
        })

        sellerADraftListingId = sellerADraftResponse.data.listing.id

        const sellerAActiveResponse = await createListing(sellerA.token, {
          print_id: `print_a_active_${uniqueSeed}`,
          status: 'active',
          quantity_available: 3,
          seller_note: 'seller A active'
        })

        sellerAActiveListingId = sellerAActiveResponse.data.listing.id

        const sellerBResponse = await createListing(sellerB.token, {
          print_id: `print_b_active_${uniqueSeed}`,
          status: 'active',
          quantity_available: 1,
          seller_note: 'seller B active'
        })

        sellerBListingId = sellerBResponse.data.listing.id
      })

      it('lists only listings that belong to the authenticated seller', async () => {
        const response = await api.get('/vendor/listings', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          }
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.listings)).toBe(true)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toEqual(
          expect.arrayContaining([sellerADraftListingId, sellerAActiveListingId])
        )
        expect(ids).not.toContain(sellerBListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.seller_id).toBe(sellerA.sellerId)
        })
      })

      it('does not allow seller_id query param to escape seller scope', async () => {
        const response = await api.get('/vendor/listings', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          },
          params: {
            seller_id: sellerB.sellerId
          }
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.listings)).toBe(true)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toEqual(
          expect.arrayContaining([sellerADraftListingId, sellerAActiveListingId])
        )
        expect(ids).not.toContain(sellerBListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.seller_id).toBe(sellerA.sellerId)
        })
      })

      it('filters authenticated seller listings by status', async () => {
        const response = await api.get('/vendor/listings', {
          headers: {
            Authorization: `Bearer ${sellerA.token}`
          },
          params: {
            status: 'active'
          }
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.listings)).toBe(true)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toContain(sellerAActiveListingId)
        expect(ids).not.toContain(sellerADraftListingId)
        expect(ids).not.toContain(sellerBListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.status).toBe('active')
          expect(listing.seller_id).toBe(sellerA.sellerId)
        })
      })

      it('retrieves own listing by id', async () => {
        const response = await api.get(
          `/vendor/listings/${sellerADraftListingId}`,
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            }
          }
        )

        expect(response.status).toBe(200)
        expect(response.data.listing.id).toBe(sellerADraftListingId)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
      })

      it('rejects retrieving a listing that belongs to another seller', async () => {
        const response = await api.get(
          `/vendor/listings/${sellerBListingId}`,
          {
            headers: {
              Authorization: `Bearer ${sellerA.token}`
            },
            validateStatus: () => true
          }
        )

        expect([403, 404]).toContain(response.status)
      })

      it('requires authentication on list and detail routes', async () => {
        const listResponse = await api.get('/vendor/listings', {
          validateStatus: () => true
        })

        const detailResponse = await api.get(
          `/vendor/listings/${sellerADraftListingId}`,
          {
            validateStatus: () => true
          }
        )

        expect([401, 403]).toContain(listResponse.status)
        expect([401, 403]).toContain(detailResponse.status)
      })
    })
  }
})