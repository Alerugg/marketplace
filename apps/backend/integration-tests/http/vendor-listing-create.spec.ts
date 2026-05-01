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
          },
          validateStatus: () => true
        }
      )
    }

    describe('Vendor Listing Create API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        sellerA = await createSellerAuthContext(
          `seller-a-create-${uniqueSeed}@example.com`,
          `Seller A Create ${uniqueSeed}`
        )

        sellerB = await createSellerAuthContext(
          `seller-b-create-${uniqueSeed}@example.com`,
          `Seller B Create ${uniqueSeed}`
        )
      })

      it('creates a draft listing for the authenticated seller', async () => {
        const printId = `print_create_draft_${Date.now()}`
        const response = await createListing(sellerA.token, {
          print_id: printId,
          status: 'draft',
          quantity_available: 2
        })

        expect(response.status).toBe(201)
        expect(response.data.listing.id).toBeTruthy()
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
        expect(response.data.listing.print_id).toBe(printId)
        expect(response.data.listing.status).toBe('draft')
        expect(response.data.listing.quantity_available).toBe(2)
      })

      it('creates an active listing when stock is greater than 0', async () => {
        const response = await createListing(sellerA.token, {
          print_id: `print_create_active_${Date.now()}`,
          status: 'active',
          quantity_available: 3
        })

        expect(response.status).toBe(201)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
        expect(response.data.listing.status).toBe('active')
        expect(response.data.listing.quantity_available).toBe(3)
      })

      it('rejects seller_id in create request body', async () => {
        const response = await createListing(sellerA.token, {
          seller_id: sellerB.sellerId
        })

        expect(response.status).toBe(400)
      })

      it('rejects an empty print_id', async () => {
        const response = await createListing(sellerA.token, {
          print_id: '   '
        })

        expect(response.status).toBe(400)
      })

      it('rejects non-positive price_amount', async () => {
        const response = await createListing(sellerA.token, {
          price_amount: 0
        })

        expect(response.status).toBe(400)
      })

      it('rejects negative quantity_available', async () => {
        const response = await createListing(sellerA.token, {
          quantity_available: -1
        })

        expect(response.status).toBe(400)
      })

      it('rejects active listing creation with zero stock', async () => {
        const response = await createListing(sellerA.token, {
          status: 'active',
          quantity_available: 0
        })

        expect(response.status).toBe(400)
      })

      it('requires authentication on create route', async () => {
        const response = await api.post('/vendor/listings', defaultListingPayload, {
          validateStatus: () => true
        })

        expect([401, 403]).toContain(response.status)
      })
    })
  }
})
