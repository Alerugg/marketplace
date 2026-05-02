import jwt from 'jsonwebtoken'

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
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
        title: `Store Cart Listing Test ${unique}`,
        type: 'publishable',
        created_by: `test_${unique}`
      })

      const apiKey = Array.isArray(created) ? created[0] : created

      return apiKey.token
    }

    const createProductVariantId = async (sellerId: string): Promise<string> => {
      const container = getContainer()
      const query = container.resolve<any>(ContainerRegistrationKeys.QUERY)
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const {
        result: [createdProduct]
      } = await createProductsWorkflow.run({
        container,
        input: {
          products: [
            {
              title: `Listing Cart Product ${unique}`,
              handle: `listing-cart-product-${unique.replace(/_/g, '-')}`,
              status: 'published',
              options: [
                {
                  title: 'Condition',
                  values: ['Near Mint']
                }
              ],
              variants: [
                {
                  title: 'Near Mint',
                  options: {
                    Condition: 'Near Mint'
                  },
                  manage_inventory: false,
                  prices: [
                    {
                      currency_code: 'usd',
                      amount: 199.99
                    }
                  ]
                }
              ]
            }
          ],
          additional_data: {
            seller_id: sellerId
          }
        }
      })

      const {
        data: [product]
      } = await query.graph(
        {
          entity: 'product',
          fields: ['id', 'variants.id'],
          filters: {
            id: createdProduct.id
          }
        },
        {
          throwIfKeyNotFound: true
        }
      )

      return product.variants[0].id
    }

    const createCart = async (_storeHeaders?: Record<string, string>) => {
      const container = getContainer()
      const cartService = container.resolve<any>('cart')

      const created = await cartService.createCarts({
        currency_code: 'usd'
      })

      const cart = Array.isArray(created) ? created[0] : created

      expect(cart.id).toBeTruthy()

      return cart
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

    describe('Store Cart Listing Add API', () => {
      let seller: SellerAuthContext
      let storeHeaders: Record<string, string>

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        const publishableApiKeyToken = await createPublishableApiKeyToken()

        storeHeaders = {
          'x-publishable-api-key': publishableApiKeyToken
        }

        seller = await createSellerAuthContext(
          `seller-cart-listing-${uniqueSeed}@example.com`,
          `Seller Cart Listing ${uniqueSeed}`
        )
      })

      it('adds an active listing to a store cart as a line item', async () => {
        const cart = await createCart(storeHeaders)
        const productVariantId = await createProductVariantId(seller.sellerId)
        const printId = `print_cart_listing_active_${Date.now()}`

        const listingResponse = await createListing(seller.token, {
          print_id: printId,
          product_variant_id: productVariantId,
          status: 'active',
          quantity_available: 3
        })

        expect(listingResponse.status).toBe(201)

        const listingId = listingResponse.data.listing.id

        const response = await api.post(
          `/store/carts/${cart.id}/listings`,
          {
            listing_id: listingId,
            quantity: 2,
            metadata: {
              source: 'store-cart-listing-test'
            }
          },
          {
            headers: storeHeaders,
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(200)
        expect(Array.isArray(response.data.cart.items)).toBe(true)

        const item = response.data.cart.items.find(
          (lineItem: any) =>
            lineItem.metadata?.marketplace_listing_id === listingId
        )

        expect(item).toBeTruthy()
        expect(item.variant_id).toBe(productVariantId)
        expect(item.quantity).toBe(2)
        expect(item.metadata.listing_id).toBe(listingId)
        expect(item.metadata.print_id).toBe(printId)
        expect(item.metadata.seller_id).toBe(seller.sellerId)
        expect(item.metadata.source).toBe('store-cart-listing-test')
      })

      it('does not add a non-active listing to the cart', async () => {
        const cart = await createCart(storeHeaders)
        const productVariantId = await createProductVariantId(seller.sellerId)

        const listingResponse = await createListing(seller.token, {
          print_id: `print_cart_listing_draft_${Date.now()}`,
          product_variant_id: productVariantId,
          status: 'draft',
          quantity_available: 3
        })

        expect(listingResponse.status).toBe(201)

        const response = await api.post(
          `/store/carts/${cart.id}/listings`,
          {
            listing_id: listingResponse.data.listing.id,
            quantity: 1
          },
          {
            headers: storeHeaders,
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(404)
        expect(response.data.message).toBe('Listing not found')
      })

      it('does not add a listing without product_variant_id', async () => {
        const cart = await createCart(storeHeaders)

        const listingResponse = await createListing(seller.token, {
          print_id: `print_cart_listing_no_variant_${Date.now()}`,
          status: 'active',
          quantity_available: 3
        })

        expect(listingResponse.status).toBe(201)

        const response = await api.post(
          `/store/carts/${cart.id}/listings`,
          {
            listing_id: listingResponse.data.listing.id,
            quantity: 1
          },
          {
            headers: storeHeaders,
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
        expect(response.data.message).toBe(
          'Listing is not connected to a product variant'
        )
      })

      it('does not add more quantity than the listing has available', async () => {
        const cart = await createCart(storeHeaders)
        const productVariantId = await createProductVariantId(seller.sellerId)

        const listingResponse = await createListing(seller.token, {
          print_id: `print_cart_listing_over_qty_${Date.now()}`,
          product_variant_id: productVariantId,
          status: 'active',
          quantity_available: 1
        })

        expect(listingResponse.status).toBe(201)

        const response = await api.post(
          `/store/carts/${cart.id}/listings`,
          {
            listing_id: listingResponse.data.listing.id,
            quantity: 2
          },
          {
            headers: storeHeaders,
            validateStatus: () => true
          }
        )

        expect(response.status).toBe(400)
        expect(response.data.message).toBe(
          'Requested quantity exceeds listing availability'
        )
      })
    })
  }
})
