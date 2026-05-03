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
}

const defaultListingPayload = {
  print_id: 'print_store_cart_customer_ownership_001',
  price_amount: 19.99,
  currency_code: 'eur',
  condition_code: 'near_mint',
  quantity_available: 1,
  status: 'active',
  seller_note: 'store cart customer ownership test listing',
  photos: ['https://example.com/a.jpg'],
  location_country: 'ES',
  shipping_profile_id: 'sp_store_cart_customer_ownership_123'
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
        handle: `store-cart-customer-ownership-seller-${unique}`,
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
          type: 'store_cart_customer_ownership'
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
              name: `Europe Store Cart Customer Ownership ${sellerLabel} ${unique}`,
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
        `seller-store-cart-customer-ownership-${sellerLabel}-${unique}@example.com`,
        `Seller Store Cart Customer Ownership ${sellerLabel} ${unique}`
      )

      await createSellerShippingProfile(
        seller,
        `Store Cart Customer Ownership Shipping Profile ${sellerLabel} ${unique}`
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
        shippingOptionId: shippingOption.id
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
              title: `Store Cart Customer Ownership Product ${unique}`,
              handle: `store-cart-customer-ownership-product-${unique.replace(/_/g, '-')}`,
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
        email: customer.email || `buyer-store-cart-customer-ownership-${unique}@example.com`,
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

    describe('Store Cart Customer Ownership API', () => {
      let marketplaceBase: MarketplaceBase
      let sellerSetup: MarketplaceSetup
      let customerA: CustomerAuthContext
      let customerB: CustomerAuthContext

      type CartActionCase = {
        method: 'post' | 'delete'
        path: string
        body?: Record<string, any>
      }

      const authHeaders = (customer: CustomerAuthContext) => ({
        Authorization: `Bearer ${customer.token}`,
        ...marketplaceBase.storeHeaders
      })

      const createActiveListing = async (quantityAvailable = 2) => {
        const productVariantId = await createProductVariantId(
          sellerSetup.seller.sellerId,
          sellerSetup.salesChannelId
        )

        return createListing(sellerSetup, {
          print_id: `print_store_cart_customer_ownership_${Date.now()}_${Math.floor(
            Math.random() * 10000
          )}`,
          product_variant_id: productVariantId,
          quantity_available: quantityAvailable,
          status: 'active'
        })
      }

      const addListingToCart = async (
        cartId: string,
        customer: CustomerAuthContext,
        listingOverride?: any
      ) => {
        const listing = listingOverride ?? (await createActiveListing())

        const response = await api.post(
          `/store/carts/${cartId}/listings`,
          {
            listing_id: listing.id,
            quantity: 1,
            metadata: {
              source: 'store-cart-customer-ownership-test'
            }
          },
          {
            headers: authHeaders(customer),
            validateStatus: () => true
          }
        )

        expectStatus(response, 200)

        const lineItemId = response.data.cart?.items?.[0]?.id

        expect(lineItemId).toBeTruthy()

        return {
          listing,
          cart: response.data.cart,
          lineItemId
        }
      }

      const addShippingMethodToCart = async (
        cartId: string,
        customer: CustomerAuthContext
      ) => {
        const response = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          {
            option_id: sellerSetup.shippingOptionId,
            data: {}
          },
          {
            headers: authHeaders(customer),
            validateStatus: () => true
          }
        )

        expectStatus(response, 200)

        return response.data.cart
      }

      const requestCartAction = async (
        actionCase: CartActionCase,
        customer?: CustomerAuthContext
      ) => {
        const config = {
          headers: customer ? authHeaders(customer) : marketplaceBase.storeHeaders,
          validateStatus: () => true
        }

        if (actionCase.method === 'post') {
          return api.post(actionCase.path, actionCase.body ?? {}, config)
        }

        return api.delete(actionCase.path, config)
      }

      beforeEach(async () => {
        const uniqueSeed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

        marketplaceBase = await setupMarketplaceBase()
        sellerSetup = await setupSellerMarketplace(
          marketplaceBase,
          `A ${uniqueSeed}`
        )

        customerA = await createCustomerAuthContext(
          `customer-a-cart-ownership-${uniqueSeed}@example.com`
        )

        customerB = await createCustomerAuthContext(
          `customer-b-cart-ownership-${uniqueSeed}@example.com`
        )
      })

      it('allows the authenticated customer to mutate and complete their own bound cart', async () => {
        const cart = await createCart(sellerSetup, customerA)

        await addListingToCart(cart.id, customerA)
        await addShippingMethodToCart(cart.id, customerA)
        await createPaymentCollectionAndSession(
          cart.id,
          authHeaders(customerA)
        )

        const completeResponse = await api.post(
          `/store/carts/${cart.id}/complete`,
          {},
          {
            headers: authHeaders(customerA),
            validateStatus: () => true
          }
        )

        expectStatus(completeResponse, 200)
        expect(completeResponse.data.order_set?.id).toBeTruthy()
      })

      it('rejects another customer across bound cart mutation routes', async () => {
        const cart = await createCart(sellerSetup, customerB)
        const listing = await createActiveListing()

        const actionCases: CartActionCase[] = [
          {
            method: 'post',
            path: `/store/carts/${cart.id}/listings`,
            body: {
              listing_id: listing.id,
              quantity: 1
            }
          },
          {
            method: 'post',
            path: `/store/carts/${cart.id}/shipping-methods`,
            body: {
              option_id: sellerSetup.shippingOptionId,
              data: {}
            }
          },
          {
            method: 'delete',
            path: `/store/carts/${cart.id}/shipping-methods`,
            body: {
              shipping_method_ids: ['cart_shipping_method_foreign']
            }
          },
          {
            method: 'delete',
            path: `/store/carts/${cart.id}/line-items/line_item_foreign`
          },
          {
            method: 'post',
            path: `/store/carts/${cart.id}/complete`,
            body: {}
          }
        ]

        for (const actionCase of actionCases) {
          const response = await requestCartAction(actionCase, customerA)

          if (![403, 404].includes(response.status)) {
            console.log('Unexpected foreign customer cart action response:', {
              method: actionCase.method,
              path: actionCase.path,
              status: response.status,
              data: response.data
            })
          }

          expect([403, 404]).toContain(response.status)
        }
      })

      it('rejects unauthenticated access across bound cart mutation routes', async () => {
        const cart = await createCart(sellerSetup, customerA)
        const listing = await createActiveListing()

        const actionCases: CartActionCase[] = [
          {
            method: 'post',
            path: `/store/carts/${cart.id}/listings`,
            body: {
              listing_id: listing.id,
              quantity: 1
            }
          },
          {
            method: 'post',
            path: `/store/carts/${cart.id}/shipping-methods`,
            body: {
              option_id: sellerSetup.shippingOptionId,
              data: {}
            }
          },
          {
            method: 'delete',
            path: `/store/carts/${cart.id}/shipping-methods`,
            body: {
              shipping_method_ids: ['cart_shipping_method_unauthenticated']
            }
          },
          {
            method: 'delete',
            path: `/store/carts/${cart.id}/line-items/line_item_unauthenticated`
          },
          {
            method: 'post',
            path: `/store/carts/${cart.id}/complete`,
            body: {}
          }
        ]

        for (const actionCase of actionCases) {
          const response = await requestCartAction(actionCase)

          if (![401, 403, 404].includes(response.status)) {
            console.log('Unexpected unauthenticated cart action response:', {
              method: actionCase.method,
              path: actionCase.path,
              status: response.status,
              data: response.data
            })
          }

          expect([401, 403, 404]).toContain(response.status)
        }
      })
    })
  }
})
