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
              title: `Listing Create Product ${unique}`,
              handle: `listing-create-product-${unique.replace(/_/g, '-')}`,
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

      it('allows creating a listing bound to own product variant', async () => {
        const productVariantId = await createProductVariantId(sellerA.sellerId)

        const response = await createListing(sellerA.token, {
          print_id: `print_own_variant_${Date.now()}`,
          product_variant_id: productVariantId
        })

        expect(response.status).toBe(201)
        expect(response.data.listing.seller_id).toBe(sellerA.sellerId)
        expect(response.data.listing.product_variant_id).toBe(productVariantId)
      })

      it('rejects creating a listing bound to another seller product variant', async () => {
        const sellerBProductVariantId = await createProductVariantId(
          sellerB.sellerId
        )

        const response = await createListing(sellerA.token, {
          print_id: `print_foreign_variant_${Date.now()}`,
          product_variant_id: sellerBProductVariantId
        })

        expect(response.status).toBe(403)
        expect(response.data.message).toContain(
          'product_variant_id does not belong to the authenticated seller'
        )
      })

      it('rejects creating a listing bound to a missing product variant', async () => {
        const response = await createListing(sellerA.token, {
          print_id: `print_missing_variant_${Date.now()}`,
          product_variant_id: `variant_missing_${Date.now()}`
        })

        expect(response.status).toBe(400)
        expect(response.data.message).toContain(
          'product_variant_id does not reference an existing product variant'
        )
      })
    })
  }
})
