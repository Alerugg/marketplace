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

    const createPublishableApiKeyToken = async (): Promise<string> => {
      const container = getContainer()
      const apiKeyService = container.resolve<any>('api_key')
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const created = await apiKeyService.createApiKeys({
        title: `Storefront Listings Test ${unique}`,
        type: 'publishable',
        created_by: `test_${unique}`
      })

      const apiKey = Array.isArray(created) ? created[0] : created

      return apiKey.token
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

    describe('Store Listing Query API', () => {
      let sellerA: SellerAuthContext
      let sellerB: SellerAuthContext

      let sellerADraftListingId: string
      let sellerAActiveListingId: string
      let sellerBActiveListingId: string

      let sellerAActivePrintId: string
      let storeHeaders: Record<string, string>

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        const publishableApiKeyToken = await createPublishableApiKeyToken()

        storeHeaders = {
          'x-publishable-api-key': publishableApiKeyToken
        }

        sellerA = await createSellerAuthContext(
          `seller-a-store-listing-${uniqueSeed}@example.com`,
          `Seller A Store Listing ${uniqueSeed}`
        )

        sellerB = await createSellerAuthContext(
          `seller-b-store-listing-${uniqueSeed}@example.com`,
          `Seller B Store Listing ${uniqueSeed}`
        )

        const sellerADraftResponse = await createListing(sellerA.token, {
          print_id: `print_store_a_draft_${uniqueSeed}`,
          status: 'draft',
          quantity_available: 2,
          seller_note: 'seller A draft public hidden'
        })

        sellerADraftListingId = sellerADraftResponse.data.listing.id

        sellerAActivePrintId = `print_store_a_active_${uniqueSeed}`

        const sellerAActiveResponse = await createListing(sellerA.token, {
          print_id: sellerAActivePrintId,
          status: 'active',
          quantity_available: 3,
          seller_note: 'seller A active public visible'
        })

        sellerAActiveListingId = sellerAActiveResponse.data.listing.id

        const sellerBActiveResponse = await createListing(sellerB.token, {
          print_id: `print_store_b_active_${uniqueSeed}`,
          status: 'active',
          quantity_available: 1,
          seller_note: 'seller B active public visible'
        })

        sellerBActiveListingId = sellerBActiveResponse.data.listing.id
      })

      it('lists only active listings publicly with publishable api key', async () => {
        const response = await api.get('/store/listings', {
          headers: storeHeaders
        })

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.listings)).toBe(true)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toEqual(
          expect.arrayContaining([sellerAActiveListingId, sellerBActiveListingId])
        )
        expect(ids).not.toContain(sellerADraftListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.status).toBe('active')
        })
      })

      it('filters public listings by seller_id without exposing non-active listings', async () => {
        const response = await api.get('/store/listings', {
          headers: storeHeaders,
          params: {
            seller_id: sellerA.sellerId
          }
        })

        expect(response.status).toBe(200)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toContain(sellerAActiveListingId)
        expect(ids).not.toContain(sellerBActiveListingId)
        expect(ids).not.toContain(sellerADraftListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.seller_id).toBe(sellerA.sellerId)
          expect(listing.status).toBe('active')
        })
      })

      it('filters public listings by print_id', async () => {
        const response = await api.get('/store/listings', {
          headers: storeHeaders,
          params: {
            print_id: sellerAActivePrintId
          }
        })

        expect(response.status).toBe(200)

        const ids = response.data.listings.map((listing: any) => listing.id)

        expect(ids).toContain(sellerAActiveListingId)
        expect(ids).not.toContain(sellerBActiveListingId)

        response.data.listings.forEach((listing: any) => {
          expect(listing.print_id).toBe(sellerAActivePrintId)
          expect(listing.status).toBe('active')
        })
      })

      it('retrieves an active listing publicly by id', async () => {
        const response = await api.get(`/store/listings/${sellerAActiveListingId}`, {
          headers: storeHeaders
        })

        expect(response.status).toBe(200)
        expect(response.data.listing.id).toBe(sellerAActiveListingId)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
        expect(response.data.listing.print_id).toBe(sellerAActivePrintId)
        expect(response.data.listing.status).toBe('active')
      })

      it('adds catalog enrichment when catalog API config is available', async () => {
        const previousCatalogApiUrl = process.env.CATALOG_API_URL
        const previousCatalogApiKey = process.env.CATALOG_API_KEY

        process.env.CATALOG_API_URL = 'http://catalog.example.test'
        process.env.CATALOG_API_KEY = 'catalog-test-key'

        const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => ({
            prints: [
              {
                query: sellerAActivePrintId,
                found: true,
                print_id: sellerAActivePrintId,
                catalog: {
                  print_id: sellerAActivePrintId,
                  game: 'pokemon',
                  game_slug: 'pokemon',
                  game_name: 'Pokémon',
                  card_id: 101,
                  card_name: 'Resolve Pikachu',
                  set_id: 201,
                  set_code: 'SV1',
                  set_name: 'Scarlet & Violet',
                  collector_number: '001',
                  language: 'en',
                  rarity: 'rare',
                  is_foil: false,
                  variant: 'default',
                  image_url: 'https://example.com/pikachu.jpg',
                  primary_image_url: 'https://example.com/pikachu.jpg',
                  print_key: 'pokemon:sv1:001:en:default',
                  external_ids: {
                    identifiers: {
                      catalog_test: 'resolve-external-001'
                    }
                  }
                }
              }
            ]
          })
        } as any)

        try {
          const listResponse = await api.get('/store/listings', {
            headers: storeHeaders,
            params: {
              print_id: sellerAActivePrintId
            }
          })

          expect(listResponse.status).toBe(200)

          const listing = listResponse.data.listings.find(
            (item: any) => item.id === sellerAActiveListingId
          )

          expect(listing).toBeTruthy()
          expect(listing.catalog).toBeTruthy()
          expect(listing.catalog.card_name).toBe('Resolve Pikachu')
          expect(listing.catalog.game_slug).toBe('pokemon')
          expect(listing.catalog.set_code).toBe('SV1')
          expect(listing.catalog.collector_number).toBe('001')
          expect(listing.catalog.primary_image_url).toBe(
            'https://example.com/pikachu.jpg'
          )

          const detailResponse = await api.get(
            `/store/listings/${sellerAActiveListingId}`,
            {
              headers: storeHeaders
            }
          )

          expect(detailResponse.status).toBe(200)
          expect(detailResponse.data.listing.catalog.card_name).toBe(
            'Resolve Pikachu'
          )

          expect(fetchMock).toHaveBeenCalled()
          expect(fetchMock.mock.calls[0][0]).toBe(
            'http://catalog.example.test/api/prints/resolve'
          )

          const requestInit = fetchMock.mock.calls[0][1] as any
          expect(requestInit.method).toBe('POST')
          expect(requestInit.headers['X-API-Key']).toBe('catalog-test-key')
          expect(JSON.parse(requestInit.body)).toEqual({
            print_ids: [sellerAActivePrintId]
          })
        } finally {
          fetchMock.mockRestore()

          if (previousCatalogApiUrl === undefined) {
            delete process.env.CATALOG_API_URL
          } else {
            process.env.CATALOG_API_URL = previousCatalogApiUrl
          }

          if (previousCatalogApiKey === undefined) {
            delete process.env.CATALOG_API_KEY
          } else {
            process.env.CATALOG_API_KEY = previousCatalogApiKey
          }
        }
      })

      it('does not retrieve a non-active listing publicly', async () => {
        const response = await api.get(`/store/listings/${sellerADraftListingId}`, {
          headers: storeHeaders,
          validateStatus: () => true
        })

        expect(response.status).toBe(404)
        expect(response.data.message).toBe('Listing not found')
      })
    })
  }
})
