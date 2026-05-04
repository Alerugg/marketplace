import jwt from 'jsonwebtoken'

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

import { StoreStatus } from '@mercurjs/framework'

import {
  createPublishableKey,
  createRegions,
  createSalesChannel,
  createSellerShippingOption,
  createSellerStockLocation,
  createServiceZoneForFulfillmentSet,
  createStore
} from '../../src/scripts/seed/seed-functions'

type SellerAuthContext = {
  token: string
  sellerId: string
  sellerName: string
}

type MarketplaceSetup = {
  seller: SellerAuthContext
  storeHeaders: Record<string, string>
  regionId: string
  salesChannelId: string
  shippingOptionId: string
}

const defaultListingPayload = {
  print_id: 'print_storefront_contract_001',
  price_amount: 19.99,
  currency_code: 'eur',
  condition_code: 'near_mint',
  quantity_available: 1,
  status: 'active',
  seller_note: 'storefront purchase flow contract test listing',
  photos: ['https://example.com/a.jpg'],
  location_country: 'ES',
  shipping_profile_id: 'sp_storefront_contract_123'
}

const requiredListingFields = [
  'id',
  'print_id',
  'product_variant_id',
  'seller_id',
  'price_amount',
  'currency_code',
  'condition_code',
  'quantity_available',
  'status',
  'seller_note',
  'photos',
  'location_country',
  'shipping_profile_id',
  'created_at',
  'updated_at'
]

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

    const expectFields = (object: Record<string, any>, fields: string[]) => {
      fields.forEach((field) => {
        expect(object).toHaveProperty(field)
      })
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
        handle: `storefront-contract-seller-${unique}`,
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
          auth_identity_id: `auth_storefront_contract_${unique}`
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
          type: 'storefront_purchase_flow_contract'
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

    const setupMarketplace = async (): Promise<MarketplaceSetup> => {
      const container = getContainer()
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      const salesChannel = await createSalesChannel(container)
      const region = await createRegions(container)

      await createStore(container, salesChannel.id, region.id)

      const publishableKey = await createPublishableKey(
        container,
        salesChannel.id
      )

      const seller = await createSellerAuthContext(
        `seller-storefront-contract-${unique}@example.com`,
        `Seller Storefront Contract ${unique}`
      )

      await createSellerShippingProfile(
        seller,
        `Storefront Contract Shipping Profile ${unique}`
      )

      const stockLocation = await createSellerStockLocation(
        container,
        seller.sellerId,
        salesChannel.id
      )

      const fulfillmentSet = stockLocation.fulfillment_sets?.[0]

      expect(fulfillmentSet?.id).toBeTruthy()

      const serviceZone = await createServiceZoneForFulfillmentSet(
        container,
        seller.sellerId,
        fulfillmentSet.id
      )

      const shippingOption = await createSellerShippingOption(
        container,
        seller.sellerId,
        seller.sellerName,
        region.id,
        serviceZone.id
      )

      return {
        seller,
        regionId: region.id,
        salesChannelId: salesChannel.id,
        shippingOptionId: shippingOption.id,
        storeHeaders: {
          'x-publishable-api-key': publishableKey.token
        }
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
              title: `Storefront Contract Product ${unique}`,
              handle: `storefront-contract-product-${unique.replace(/_/g, '-')}`,
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

    const createCart = async (setup: MarketplaceSetup) => {
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
        email: `buyer-storefront-contract-${unique}@example.com`,
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

    describe('Storefront Purchase Flow Contract API', () => {
      let setup: MarketplaceSetup

      beforeEach(async () => {
        setup = await setupMarketplace()
      })

      it('exposes only active listing contracts to the storefront', async () => {
        const productVariantId = await createProductVariantId(
          setup.seller.sellerId,
          setup.salesChannelId
        )

        const activePrintId = `print_storefront_active_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`

        const activeListing = await createListing(setup, {
          print_id: activePrintId,
          product_variant_id: productVariantId,
          status: 'active',
          quantity_available: 2
        })

        const draftListing = await createListing(setup, {
          print_id: `print_storefront_draft_${Date.now()}_${Math.floor(
            Math.random() * 10000
          )}`,
          product_variant_id: productVariantId,
          status: 'draft',
          quantity_available: 2
        })

        const listResponse = await api.get('/store/listings', {
          headers: setup.storeHeaders,
          params: {
            print_id: activePrintId
          },
          validateStatus: () => true
        })

        expectStatus(listResponse, 200)
        expect(Array.isArray(listResponse.data.listings)).toBe(true)

        const activeListItem = listResponse.data.listings.find(
          (listing: any) => listing.id === activeListing.id
        )

        expect(activeListItem).toBeTruthy()
        expectFields(activeListItem, requiredListingFields)
        expect(activeListItem.status).toBe('active')
        expect(activeListItem.print_id).toBe(activePrintId)
        expect(activeListItem.product_variant_id).toBe(productVariantId)
        expect(activeListItem.seller_id).toBe(setup.seller.sellerId)

        const detailResponse = await api.get(
          `/store/listings/${activeListing.id}`,
          {
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(detailResponse, 200)
        expectFields(detailResponse.data.listing, requiredListingFields)
        expect(detailResponse.data.listing.id).toBe(activeListing.id)
        expect(detailResponse.data.listing.status).toBe('active')

        const draftDetailResponse = await api.get(
          `/store/listings/${draftListing.id}`,
          {
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(draftDetailResponse, 404)
        expect(draftDetailResponse.data.message).toBe('Listing not found')
      })

      it('supports the storefront buyer purchase flow contract end to end', async () => {
        const productVariantId = await createProductVariantId(
          setup.seller.sellerId,
          setup.salesChannelId
        )

        const printId = `print_storefront_purchase_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`

        const listing = await createListing(setup, {
          print_id: printId,
          product_variant_id: productVariantId,
          status: 'active',
          quantity_available: 1
        })

        const cart = await createCart(setup)

        const addListingResponse = await api.post(
          `/store/carts/${cart.id}/listings`,
          {
            listing_id: listing.id,
            quantity: 1,
            metadata: {
              source: 'storefront-purchase-flow-contract-test'
            }
          },
          {
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(addListingResponse, 200)
        expect(addListingResponse.data.cart?.id).toBe(cart.id)
        expect(Array.isArray(addListingResponse.data.cart?.items)).toBe(true)

        const lineItem = addListingResponse.data.cart.items.find(
          (item: any) => item.metadata?.marketplace_listing_id === listing.id
        )

        expect(lineItem).toBeTruthy()
        expect(lineItem.variant_id).toBe(productVariantId)
        expect(lineItem.quantity).toBe(1)
        expect(lineItem.metadata.listing_id).toBe(listing.id)
        expect(lineItem.metadata.print_id).toBe(printId)
        expect(lineItem.metadata.seller_id).toBe(setup.seller.sellerId)
        expect(lineItem.metadata.source).toBe(
          'storefront-purchase-flow-contract-test'
        )

        const shippingOptionsResponse = await api.get('/store/shipping-options', {
          headers: setup.storeHeaders,
          params: {
            cart_id: cart.id
          },
          validateStatus: () => true
        })

        expectStatus(shippingOptionsResponse, 200)
        expect(Array.isArray(shippingOptionsResponse.data.shipping_options)).toBe(
          true
        )
        expect(shippingOptionsResponse.data.shipping_options.length).toBeGreaterThan(
          0
        )

        const addShippingResponse = await api.post(
          `/store/carts/${cart.id}/shipping-methods`,
          {
            option_id: setup.shippingOptionId,
            data: {}
          },
          {
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(addShippingResponse, 200)
        expect(addShippingResponse.data.cart?.id).toBe(cart.id)

        const paymentCollectionResponse = await api.post(
          '/store/payment-collections',
          {
            cart_id: cart.id
          },
          {
            headers: setup.storeHeaders,
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
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(paymentSessionResponse, 200)
        expect(paymentSessionResponse.data.payment_collection?.id).toBe(
          paymentCollection.id
        )

        const completeResponse = await api.post(
          `/store/carts/${cart.id}/complete`,
          {},
          {
            headers: setup.storeHeaders,
            validateStatus: () => true
          }
        )

        expectStatus(completeResponse, 200)

        const orderSet = completeResponse.data.order_set
        const order = orderSet?.orders?.[0]

        expect(orderSet?.id).toBeTruthy()
        expect(Array.isArray(orderSet.orders)).toBe(true)
        expect(order?.id).toBeTruthy()
        expect(order?.currency_code).toBe('eur')
        expect(order?.items?.length).toBeGreaterThan(0)
      })
    })
  }
})
