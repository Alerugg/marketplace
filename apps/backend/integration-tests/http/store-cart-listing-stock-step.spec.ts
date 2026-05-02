import { medusaIntegrationTestRunner } from '@medusajs/test-utils'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { decrementListingStockForCartStep } from '../../../../packages/modules/b2c-core/src/workflows/cart/steps/decrement-listing-stock-for-cart'

jest.setTimeout(90 * 1000)

type ListingStockTestWorkflowInput = {
  line_items: {
    quantity: number
    variant_id?: string | null
    metadata?: Record<string, unknown> | null
  }[]
}

const listingStockTestWorkflow = createWorkflow(
  {
    name: 'listing-stock-test-workflow'
  },
  (input: ListingStockTestWorkflowInput) => {
    const result = decrementListingStockForCartStep(input)

    return new WorkflowResponse(result)
  }
)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const createListing = async (overrides: Record<string, any> = {}) => {
      const container = getContainer()
      const listingModuleService = container.resolve<any>('listing')
      const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

      return listingModuleService.createListings({
        print_id: `print_stock_step_${unique}`,
        product_variant_id: `variant_stock_step_${unique}`,
        seller_id: `seller_stock_step_${unique}`,
        price_amount: 199.99,
        currency_code: 'usd',
        condition_code: 'near_mint',
        quantity_available: 2,
        status: 'active',
        ...overrides
      })
    }

    const runStockWorkflow = async (
      input: ListingStockTestWorkflowInput
    ) => {
      const container = getContainer()
      const transactionId = `listing-stock-test-${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}`

      return listingStockTestWorkflow(container).run({
        input,
        context: {
          transactionId
        }
      })
    }

    const expectWorkflowError = async (
      action: Promise<unknown>,
      expectedMessage: string
    ) => {
      try {
        const result: any = await action
        const resolvedMessage =
          result?.errors?.[0]?.error?.message ??
          result?.errors?.[0]?.message ??
          result?.transaction?.errors?.[0]?.error?.message ??
          result?.transaction?.errors?.[0]?.message

        expect(resolvedMessage).toContain(expectedMessage)
      } catch (error: any) {
        expect(error?.message).toContain(expectedMessage)
      }
    }

    describe('Store Cart Listing Stock Step', () => {
      it('decrements listing stock for a marketplace listing line item', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 2,
          status: 'active'
        })

        await runStockWorkflow({
          line_items: [
            {
              quantity: 1,
              variant_id: listing.product_variant_id,
              metadata: {
                marketplace_listing_id: listing.id
              }
            }
          ]
        })

        const updatedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(updatedListing.quantity_available).toBe(1)
        expect(updatedListing.status).toBe('active')
      })

      it('marks listing as sold when stock reaches zero', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 1,
          status: 'active'
        })

        await runStockWorkflow({
          line_items: [
            {
              quantity: 1,
              variant_id: listing.product_variant_id,
              metadata: {
                marketplace_listing_id: listing.id
              }
            }
          ]
        })

        const updatedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(updatedListing.quantity_available).toBe(0)
        expect(updatedListing.status).toBe('sold')
      })

      it('aggregates multiple cart line items for the same listing', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 3,
          status: 'active'
        })

        await runStockWorkflow({
          line_items: [
            {
              quantity: 1,
              variant_id: listing.product_variant_id,
              metadata: {
                marketplace_listing_id: listing.id
              }
            },
            {
              quantity: 2,
              variant_id: listing.product_variant_id,
              metadata: {
                listing_id: listing.id
              }
            }
          ]
        })

        const updatedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(updatedListing.quantity_available).toBe(0)
        expect(updatedListing.status).toBe('sold')
      })

      it('rejects cart line items whose variant does not match the listing variant', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 2,
          status: 'active'
        })

        await expectWorkflowError(
          runStockWorkflow({
            line_items: [
              {
                quantity: 1,
                variant_id: 'variant_wrong',
                metadata: {
                  marketplace_listing_id: listing.id
                }
              }
            ]
          }),
          'Cart line item variant does not match listing product variant'
        )

        const unchangedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(unchangedListing.quantity_available).toBe(2)
        expect(unchangedListing.status).toBe('active')
      })


      it('allows only one direct listing stock decrement when two calls race for one unit', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 1,
          status: 'active'
        })

        const results = await Promise.allSettled([
          listingModuleService.decrementListingQuantity({
            id: listing.id,
            quantity: 1
          }),
          listingModuleService.decrementListingQuantity({
            id: listing.id,
            quantity: 1
          })
        ])

        const fulfilled = results.filter(
          (result) => result.status === 'fulfilled'
        )
        const rejected = results.filter(
          (result) => result.status === 'rejected'
        )

        expect(fulfilled).toHaveLength(1)
        expect(rejected).toHaveLength(1)

        const updatedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(updatedListing.quantity_available).toBe(0)
        expect(updatedListing.status).toBe('sold')
      })

      it('rejects overselling listing stock', async () => {
        const container = getContainer()
        const listingModuleService = container.resolve<any>('listing')

        const listing = await createListing({
          quantity_available: 1,
          status: 'active'
        })

        await expectWorkflowError(
          runStockWorkflow({
            line_items: [
              {
                quantity: 2,
                variant_id: listing.product_variant_id,
                metadata: {
                  marketplace_listing_id: listing.id
                }
              }
            ]
          }),
          'Requested quantity exceeds listing availability'
        )

        const unchangedListing = await listingModuleService.retrieveListing(
          listing.id
        )

        expect(unchangedListing.quantity_available).toBe(1)
        expect(unchangedListing.status).toBe('active')
      })
    })
  }
})
