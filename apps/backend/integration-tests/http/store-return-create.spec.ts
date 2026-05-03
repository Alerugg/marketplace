import jwt from 'jsonwebtoken'

import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  createProductsWorkflow,
  createServiceZonesWorkflow
} from '@medusajs/medusa/core-flows'
import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

import { StoreStatus } from '@mercurjs/framework'

import {
  createPublishableKey,
  createRegions,
  createSalesChannel,
  createSellerShippingOption,
  createSellerStockLocation,
  createStore
} from '../../src/scripts/seed/seed-functions'

type SellerAuthContext = {
  token: string
  sellerId: string
  sellerName: string
}

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

type MarketplaceSetup = MarketplaceBase & {
  seller: SellerAuthContext
  shippingOptionId: string
  stockLocationId: string
}

const defaultListingPayload = {
  print_id: 'print_store_return_create_001',
  price_amount: 19.99,
  currency_code: 'eur',
  condition_code: 'near_mint',
  quantity_available: 1,
  status: 'active',
  seller_note: 'store return create test listing',
  photos: ['https://example.com/a.jpg'],
  location_country: 'ES',
  shipping_profile_id: 'sp_store_return_create_123'
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
        first_name: 'Store',
        last_name: `Customer ${unique}`
      })

      const customer = Array.isArray(created) ? created[0] : created

      const token = jwt.sign(
        {
          actor_id: customer.id,
          actor_type: 'customer',
          auth_identity_id: `auth_customer_${unique}`
        },
        process.env.JWT_SECRET || 'supersecret'
      )

      return {
        token,
        customerId: customer.id,
        email: customer.email
      }
    }

    const createSellerAuthContext = async (
      email: string,
      sellerName: string
    ): Promise<SellerAuthContext> => {
      const container = getContainer()
      const sellerService = container.resolve<any>('seller')
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const seller = await sellerService.createSellers({
        name: sellerName,
        handle: `store-return-create-seller-${unique}`,
        store_status: StoreStatus.ACTIVE
      })

      await sellerService.updateSellers({
        id: seller.id,
        store_status: StoreStatus.ACTIVE
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
          auth_identity_id: `auth_seller_${unique}`
        },
        process.env.JWT_SECRET || 'supersecret'
      )

      return {
        token,
        sellerId: seller.id,
        sellerName
      }
    }

    const createSellerShippingProfile = async (
      seller: SellerAuthContext,
      name: string
    ) => {
      const response = await api.post(
        '/vendor/shipping-profiles',
        {
          name,
          type: 'store_return_create'
        },
        {
          headers: {
            Authorization: `Bearer ${seller.token}`
          },
          validateStatus: () => true
        }
      )

      expectStatus(response, 201)

      return response.data.shipping_profile
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

    const createUniqueServiceZoneForFulfillmentSet = async (
      fulfillmentSetId: string,
      sellerLabel: string
    ) => {
      const container = getContainer()
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const {
        result: [serviceZone]
      } = await createServiceZonesWorkflow.run({
        container,
        input: {
          data: [
            {
              name: `Europe Store Return Create ${sellerLabel} ${unique}`,
              fulfillment_set_id: fulfillmentSetId,
              geo_zones: [
                {
                  type: 'country',
                  country_code: 'es'
                }
              ]
            }
          ]
        }
      })

      return serviceZone
    }

    const setupSellerMarketplace = async (
      base: MarketplaceBase,
      sellerLabel: string
    ): Promise<MarketplaceSetup> => {
      const container = getContainer()
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const seller = await createSellerAuthContext(
        `seller-store-return-create-${sellerLabel}-${unique}@example.com`,
        `Seller Store Return Create ${sellerLabel} ${unique}`
      )

      await createSellerShippingProfile(
        seller,
        `Store Return Create Shipping Profile ${sellerLabel} ${unique}`
      )

      const stockLocation = await createSellerStockLocation(
        container,
        seller.sellerId,
        base.salesChannelId
      )

      const fulfillmentSet = stockLocation.fulfillment_sets?.[0]

      expect(fulfillmentSet?.id).toBeTruthy()

      const serviceZone = await createUniqueServiceZoneForFulfillmentSet(
        fulfillmentSet.id,
        sellerLabel
      )

      const shippingOption = await createSellerShippingOption(
        container,
        seller.sellerId,
        seller.sellerName,
        base.regionId,
        serviceZone.id
      )

      return {
        ...base,
        seller,
        shippingOptionId: shippingOption.id,
        stockLocationId: stockLocation.id
      }
    }

    const createProductVariantId = async (
      sellerId: string,
      salesChannelId: string
    ): Promise<string> => {
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
              title: `Store Return Create Product ${unique}`,
              handle: `store-return-create-product-${unique.replace(/_/g, '-')}`,
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

    const createCart = async (
      setup: MarketplaceSetup,
      customer: CustomerAuthContext
    ) => {
      const container = getContainer()
      const cartService = container.resolve<any>('cart')
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const address = {
        first_name: 'Test',
        last_name: 'Buyer',
        address_1: 'Test Street 1',
        city: 'Madrid',
        country_code: 'es',
        postal_code: '28001',
        phone: '+34910000000'
      }

      const created = await cartService.createCarts({
        currency_code: 'eur',
        region_id: setup.regionId,
        sales_channel_id: setup.salesChannelId,
        customer_id: customer.customerId,
        email: customer.email || `buyer-store-return-create-${unique}@example.com`,
        shipping_address: address,
        billing_address: address
      })

      const cart = Array.isArray(created) ? created[0] : created

      expect(cart.id).toBeTruthy()

      return cart
    }

    const createListing = async (
      setup: MarketplaceSetup,
      overrides: Record<string, any> = {}
    ) => {
      const response = await api.post(
        '/vendor/listings',
        {
          ...defaultListingPayload,
          ...overrides
        },
        {
          headers: {
            Authorization: `Bearer ${setup.seller.token}`
          },
          validateStatus: () => true
        }
      )

      expectStatus(response, 201)

      return response.data.listing
    }

    const createPaymentCollectionAndSession = async (
      cartId: string,
      storeHeaders: Record<string, string>
    ) => {
      const paymentCollectionResponse = await api.post(
        '/store/payment-collections',
        {
          cart_id: cartId
        },
        {
          headers: storeHeaders,
          validateStatus: () => true
        }
      )

      expectStatus(paymentCollectionResponse, 200)

      const paymentCollection =
        paymentCollectionResponse.data.payment_collection

      expect(paymentCollection?.id).toBeTruthy()

      const paymentSessionResponse = await api.post(
        `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
        {
          provider_id: 'pp_system_default',
          data: {}
        },
        {
          headers: storeHeaders,
          validateStatus: () => true
        }
      )

      expectStatus(paymentSessionResponse, 200)

      return paymentSessionResponse.data.payment_collection
    }

    const completeCartWithListingAndReturnOrderId = async (
      setup: MarketplaceSetup,
      customer: CustomerAuthContext
    ): Promise<string> => {
      const productVariantId = await createProductVariantId(
        setup.seller.sellerId,
        setup.salesChannelId
      )

      const listing = await createListing(setup, {
        print_id: `print_store_return_create_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`,
        product_variant_id: productVariantId,
        quantity_available: 1,
        status: 'active'
      })

      const cart = await createCart(setup, customer)

      const addListingResponse = await api.post(
        `/store/carts/${cart.id}/listings`,
        {
          listing_id: listing.id,
          quantity: 1,
          metadata: {
            source: 'store-return-create-test'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${customer.token}`,
            ...setup.storeHeaders
          },
          validateStatus: () => true
        }
      )

      expectStatus(addListingResponse, 200)

      const shippingResponse = await api.post(
        `/store/carts/${cart.id}/shipping-methods`,
        {
          option_id: setup.shippingOptionId,
          data: {}
        },
        {
          headers: {
            Authorization: `Bearer ${customer.token}`,
            ...setup.storeHeaders
          },
          validateStatus: () => true
        }
      )

      expectStatus(shippingResponse, 200)

      await createPaymentCollectionAndSession(cart.id, {
        Authorization: `Bearer ${customer.token}`,
        ...setup.storeHeaders
      })

      const completeResponse = await api.post(
        `/store/carts/${cart.id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${customer.token}`,
            ...setup.storeHeaders
          },
          validateStatus: () => true
        }
      )

      expectStatus(completeResponse, 200)

      const orderId = completeResponse.data.order_set?.orders?.[0]?.id

      expect(orderId).toBeTruthy()

      return orderId
    }

    const createReturnForOrder = async (orderId: string): Promise<string> => {
      const container = getContainer()
      const query = container.resolve<any>(ContainerRegistrationKeys.QUERY)
      const orderService = container.resolve<any>(Modules.ORDER)

      const {
        data: [order]
      } = await query.graph(
        {
          entity: 'order',
          fields: ['id', 'version'],
          filters: {
            id: orderId
          }
        },
        {
          throwIfKeyNotFound: true
        }
      )

      const created = await orderService.createReturns({
        order_id: orderId,
        order_version: order.version,
        status: 'requested',
        requested_at: new Date(),
        refund_amount: 0,
        metadata: {
          source: 'store-return-create-test'
        }
      })

      const orderReturn = Array.isArray(created) ? created[0] : created

      expect(orderReturn?.id).toBeTruthy()

      return orderReturn.id
    }

    describe('Store Return Create API', () => {
      let marketplaceBase: MarketplaceBase
      let sellerSetup: MarketplaceSetup
      let customerA: CustomerAuthContext
      let customerB: CustomerAuthContext
      let customerAOrderId: string
      let customerBOrderId: string

      const getFirstOrderReturnItem = async (orderId: string) => {
        const container = getContainer()
        const query = container.resolve<any>(ContainerRegistrationKeys.QUERY)

        const {
          data: [order]
        } = await query.graph(
          {
            entity: 'order',
            fields: ['id', 'items.id', 'items.quantity'],
            filters: {
              id: orderId
            }
          },
          {
            throwIfKeyNotFound: true
          }
        )

        const item = order.items?.[0]

        expect(item?.id).toBeTruthy()

        return {
          id: item.id,
          quantity: 1
        }
      }


      const fulfillOrder = async (
        setup: MarketplaceSetup,
        orderId: string
      ) => {
        const item = await getFirstOrderReturnItem(orderId)

        const response = await api.post(
          `/vendor/orders/${orderId}/fulfillments`,
          {
            items: [item],
            requires_shipping: true,
            location_id: setup.stockLocationId
          },
          {
            headers: {
              Authorization: `Bearer ${setup.seller.token}`
            },
            validateStatus: () => true
          }
        )

        expectStatus(response, 200)

        const fulfillment = Array.isArray(response.data.fulfillment)
          ? response.data.fulfillment[0]
          : response.data.fulfillment

        expect(fulfillment?.id).toBeTruthy()

        return fulfillment.id
      }

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        marketplaceBase = await setupMarketplaceBase()
        sellerSetup = await setupSellerMarketplace(
          marketplaceBase,
          `A ${uniqueSeed}`
        )

        customerA = await createCustomerAuthContext(
          `customer-a-return-create-${uniqueSeed}@example.com`
        )

        customerB = await createCustomerAuthContext(
          `customer-b-return-create-${uniqueSeed}@example.com`
        )

        customerAOrderId = await completeCartWithListingAndReturnOrderId(
          sellerSetup,
          customerA
        )

        customerBOrderId = await completeCartWithListingAndReturnOrderId(
          sellerSetup,
          customerB
        )

        await fulfillOrder(sellerSetup, customerAOrderId)
        await fulfillOrder(sellerSetup, customerBOrderId)
      })

      it('allows an authenticated customer to create a return for their own order', async () => {
        const item = await getFirstOrderReturnItem(customerAOrderId)

        const response = await api.post(
          '/store/returns',
          {
            order_id: customerAOrderId,
            items: [item],
            return_shipping: {
              option_id: sellerSetup.shippingOptionId
            }
          },
          {
            headers: {
              Authorization: `Bearer ${customerA.token}`,
              ...marketplaceBase.storeHeaders
            },
            validateStatus: () => true
          }
        )

        expectStatus(response, 200)
        expect(response.data.return?.id).toBeTruthy()
      })

      it('rejects creating a return for another customer order', async () => {
        const item = await getFirstOrderReturnItem(customerBOrderId)

        const response = await api.post(
          '/store/returns',
          {
            order_id: customerBOrderId,
            items: [item],
            return_shipping: {
              option_id: sellerSetup.shippingOptionId
            }
          },
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

      it('requires authentication when creating a return', async () => {
        const item = await getFirstOrderReturnItem(customerAOrderId)

        const response = await api.post(
          '/store/returns',
          {
            order_id: customerAOrderId,
            items: [item],
            return_shipping: {
              option_id: sellerSetup.shippingOptionId
            }
          },
          {
            headers: marketplaceBase.storeHeaders,
            validateStatus: () => true
          }
        )

        expect([401, 403]).toContain(response.status)
      })
    })
  }
})
