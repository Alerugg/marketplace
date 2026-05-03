import jwt from 'jsonwebtoken'

import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

import {
  createPublishableKey,
  createRegions,
  createSalesChannel,
  createStore
} from '../../src/scripts/seed/seed-functions'

type CustomerAuthContext = {
  token: string
  customerId: string
  email: string
}

type MarketplaceBase = {
  storeHeaders: Record<string, string>
  regionId: string
  salesChannelId: string
}

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const expectStatus = (response: any, expectedStatus: number) => {
      if (response.status !== expectedStatus) {
        console.log('Unexpected response status:', response.status)
        console.log(JSON.stringify(response.data, null, 2))
      }

      expect(response.status).toBe(expectedStatus)
    }

    const createCustomerAuthContext = async (
      email: string
    ): Promise<CustomerAuthContext> => {
      const container = getContainer()
      const customerService = container.resolve<any>(Modules.CUSTOMER)
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const created = await customerService.createCustomers({
        email,
        first_name: 'Wishlist',
        last_name: `Customer ${unique}`
      })

      const customer = Array.isArray(created) ? created[0] : created

      const token = jwt.sign(
        {
          actor_id: customer.id,
          actor_type: 'customer',
          auth_identity_id: `auth_customer_wishlist_${unique}`
        },
        process.env.JWT_SECRET || 'supersecret'
      )

      return {
        token,
        customerId: customer.id,
        email: customer.email
      }
    }

    const setupMarketplaceBase = async (): Promise<MarketplaceBase> => {
      const container = getContainer()

      const salesChannel = await createSalesChannel(container)
      const region = await createRegions(container)

      await createStore(container, salesChannel.id, region.id)

      const publishableKey = await createPublishableKey(
        container,
        salesChannel.id
      )

      return {
        regionId: region.id,
        salesChannelId: salesChannel.id,
        storeHeaders: {
          'x-publishable-api-key': publishableKey.token
        }
      }
    }

    const createProductId = async (salesChannelId: string): Promise<string> => {
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
              title: `Store Wishlist Product ${unique}`,
              handle: `store-wishlist-product-${unique.replace(/_/g, '-')}`,
              status: 'published',
              sales_channels: [
                {
                  id: salesChannelId
                }
              ],
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
                      currency_code: 'eur',
                      amount: 19.99
                    }
                  ]
                }
              ]
            }
          ]
        }
      })

      const {
        data: [product]
      } = await query.graph(
        {
          entity: 'product',
          fields: ['id'],
          filters: {
            id: createdProduct.id
          }
        },
        {
          throwIfKeyNotFound: true
        }
      )

      return product.id
    }

    const createWishlistEntry = async (
      base: MarketplaceBase,
      customer: CustomerAuthContext,
      productId: string
    ) => {
      const response = await api.post(
        '/store/wishlist',
        {
          reference: 'product',
          reference_id: productId
        },
        {
          headers: {
            Authorization: `Bearer ${customer.token}`,
            ...base.storeHeaders
          },
          validateStatus: () => true
        }
      )

      expectStatus(response, 201)
      expect(response.data.wishlist?.id).toBeTruthy()

      return response.data.wishlist
    }

    describe('Store Wishlist API', () => {
      let marketplaceBase: MarketplaceBase
      let customerA: CustomerAuthContext
      let customerB: CustomerAuthContext
      let customerAProductId: string
      let customerBProductId: string
      let customerAWishlistId: string
      let customerBWishlistId: string

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        marketplaceBase = await setupMarketplaceBase()

        customerA = await createCustomerAuthContext(
          `customer-a-wishlist-${uniqueSeed}@example.com`
        )

        customerB = await createCustomerAuthContext(
          `customer-b-wishlist-${uniqueSeed}@example.com`
        )

        customerAProductId = await createProductId(
          marketplaceBase.salesChannelId
        )

        customerBProductId = await createProductId(
          marketplaceBase.salesChannelId
        )

        const customerAWishlist = await createWishlistEntry(
          marketplaceBase,
          customerA,
          customerAProductId
        )

        const customerBWishlist = await createWishlistEntry(
          marketplaceBase,
          customerB,
          customerBProductId
        )

        customerAWishlistId = customerAWishlist.id
        customerBWishlistId = customerBWishlist.id
      })

      it('allows the authenticated customer to add a product to their wishlist', async () => {
        const productId = await createProductId(marketplaceBase.salesChannelId)

        const response = await api.post(
          '/store/wishlist',
          {
            reference: 'product',
            reference_id: productId
          },
          {
            headers: {
              Authorization: `Bearer ${customerA.token}`,
              ...marketplaceBase.storeHeaders
            },
            validateStatus: () => true
          }
        )

        expectStatus(response, 201)
        expect(response.data.wishlist?.id).toBe(customerAWishlistId)
      })

      it('lists only wishlist products that belong to the authenticated customer', async () => {
        const response = await api.get('/store/wishlist', {
          headers: {
            Authorization: `Bearer ${customerA.token}`,
            ...marketplaceBase.storeHeaders
          },
          validateStatus: () => true
        })

        expectStatus(response, 200)
        expect(Array.isArray(response.data.wishlists)).toBe(true)

        const payload = JSON.stringify(response.data.wishlists)

        expect(payload).toContain(customerAProductId)
        expect(payload).not.toContain(customerBProductId)
      })

      it('allows the authenticated customer to delete their own wishlist product', async () => {
        const response = await api.delete(
          `/store/wishlist/${customerAWishlistId}/product/${customerAProductId}`,
          {
            headers: {
              Authorization: `Bearer ${customerA.token}`,
              ...marketplaceBase.storeHeaders
            },
            validateStatus: () => true
          }
        )

        expectStatus(response, 200)
        expect(response.data.id).toBe(customerAWishlistId)
        expect(response.data.reference_id).toBe(customerAProductId)
        expect(response.data.deleted).toBe(true)
      })

      it('rejects deleting a wishlist product that belongs to another customer', async () => {
        const response = await api.delete(
          `/store/wishlist/${customerBWishlistId}/product/${customerBProductId}`,
          {
            headers: {
              Authorization: `Bearer ${customerA.token}`,
              ...marketplaceBase.storeHeaders
            },
            validateStatus: () => true
          }
        )

        expect([403, 404]).toContain(response.status)
      })

      it('requires authentication on wishlist routes', async () => {
        const listResponse = await api.get('/store/wishlist', {
          headers: marketplaceBase.storeHeaders,
          validateStatus: () => true
        })

        const createResponse = await api.post(
          '/store/wishlist',
          {
            reference: 'product',
            reference_id: customerAProductId
          },
          {
            headers: marketplaceBase.storeHeaders,
            validateStatus: () => true
          }
        )

        const deleteResponse = await api.delete(
          `/store/wishlist/${customerAWishlistId}/product/${customerAProductId}`,
          {
            headers: marketplaceBase.storeHeaders,
            validateStatus: () => true
          }
        )

        expect([401, 403]).toContain(listResponse.status)
        expect([401, 403]).toContain(createResponse.status)
        expect([401, 403]).toContain(deleteResponse.status)
      })
    })
  }
})
