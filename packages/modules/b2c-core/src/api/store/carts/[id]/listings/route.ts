import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from '@medusajs/framework/utils'
import { addToCartWorkflowId } from '@medusajs/medusa/core-flows'

import {
  LISTING_MODULE,
  ListingModuleService
} from '../../../../../modules/listing'
import { StoreAddListingToCartType } from '../../validators'

export const POST = async (
  req: MedusaRequest<StoreAddListingToCartType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)

  const listingModuleService =
    req.scope.resolve<ListingModuleService>(LISTING_MODULE)

  const { listing_id, quantity, metadata } = req.validatedBody

  const listing = await listingModuleService.retrieveListing(listing_id)

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

  if (listing.quantity_available < quantity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Requested quantity exceeds listing availability'
    )
  }

  await workflowEngine.run(addToCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      items: [
        {
          variant_id: listing.product_variant_id,
          quantity,
          metadata: {
            ...(metadata ?? {}),
            marketplace_listing_id: listing.id,
            listing_id: listing.id,
            print_id: listing.print_id,
            seller_id: listing.seller_id
          }
        }
      ]
    },
    transactionId: `cart-add-listing-${req.params.id}-${listing.id}`
  })

  const {
    data: [cart]
  } = await query.graph({
    entity: 'cart',
    filters: {
      id: req.params.id
    },
    fields: req.queryConfig.fields
  })

  res.status(200).json({ cart })
}
