import { MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import {
  LISTING_MODULE,
  ListingModuleService
} from '../../../modules/listing'
import { ListingStatus } from '../../../modules/listing/constants'

type CartListingLineItem = {
  id?: string
  quantity: number
  variant_id?: string | null
  metadata?: Record<string, unknown> | null
}

type ListingStockMutation = {
  id: string
  quantity: number
  previous_quantity_available: number
  previous_status: ListingStatus
}

const getListingIdFromLineItem = (item: CartListingLineItem) => {
  const rawListingId =
    item.metadata?.marketplace_listing_id ?? item.metadata?.listing_id

  if (typeof rawListingId !== 'string') {
    return null
  }

  const listingId = rawListingId.trim()

  return listingId.length ? listingId : null
}

const restoreListingStockMutations = async (
  listingModuleService: ListingModuleService,
  mutations: ListingStockMutation[]
) => {
  for (const mutation of [...mutations].reverse()) {
    await listingModuleService.updateListings(
      {
        id: mutation.id,
        quantity_available: mutation.previous_quantity_available,
        status: mutation.previous_status
      },
      {
        allow_checkout_stock_compensation: true
      }
    )
  }
}

export const decrementListingStockForCartStep = createStep(
  'decrement-listing-stock-for-cart',
  async (input: { line_items: CartListingLineItem[] }, { container }) => {
    const listingModuleService =
      container.resolve<ListingModuleService>(LISTING_MODULE)

    const listingLineItems = new Map<
      string,
      {
        quantity: number
        variantIds: Set<string>
      }
    >()

    for (const item of input.line_items ?? []) {
      const listingId = getListingIdFromLineItem(item)

      if (!listingId) {
        continue
      }

      const quantity = Number(item.quantity)

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Listing cart line item quantity must be an integer greater than 0'
        )
      }

      const entry = listingLineItems.get(listingId) ?? {
        quantity: 0,
        variantIds: new Set<string>()
      }

      entry.quantity += quantity

      if (item.variant_id) {
        entry.variantIds.add(item.variant_id)
      }

      listingLineItems.set(listingId, entry)
    }

    if (!listingLineItems.size) {
      return new StepResponse([], [])
    }

    const mutations: ListingStockMutation[] = []

    for (const [listingId, lineItemData] of listingLineItems) {
      const listing = await listingModuleService.retrieveListing(listingId)

      if (listing.status !== 'active') {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'Listing not found'
        )
      }

      if (!listing.product_variant_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Listing is not connected to a product variant'
        )
      }

      if (
        lineItemData.variantIds.size !== 1 ||
        !lineItemData.variantIds.has(listing.product_variant_id)
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Cart line item variant does not match listing product variant'
        )
      }

      if (listing.quantity_available < lineItemData.quantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Requested quantity exceeds listing availability'
        )
      }

      mutations.push({
        id: listing.id,
        quantity: lineItemData.quantity,
        previous_quantity_available: listing.quantity_available,
        previous_status: listing.status as ListingStatus
      })
    }

    const appliedMutations: ListingStockMutation[] = []

    try {
      for (const mutation of mutations) {
        await listingModuleService.decrementListingQuantity({
          id: mutation.id,
          quantity: mutation.quantity
        })

        appliedMutations.push(mutation)
      }
    } catch (error) {
      await restoreListingStockMutations(
        listingModuleService,
        appliedMutations
      )

      throw error
    }

    return new StepResponse(mutations, mutations)
  },
  async (mutations: ListingStockMutation[] | undefined, { container }) => {
    if (!mutations?.length) {
      return
    }

    const listingModuleService =
      container.resolve<ListingModuleService>(LISTING_MODULE)

    await restoreListingStockMutations(listingModuleService, mutations)
  }
)
