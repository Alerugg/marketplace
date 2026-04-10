import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { LISTING_MODULE, ListingModuleService } from '../../../modules/listing'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { VendorCreateListingType } from './validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateListingType>,
  res: MedusaResponse
) => {
  const listingModuleService =
    req.scope.resolve<ListingModuleService>(LISTING_MODULE)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const listing = await listingModuleService.createListings({
    ...req.validatedBody,
    seller_id: seller.id
  } as any)

  const listingData = await refetchEntity(
    'listing',
    listing.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(201).json({ listing: listingData })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: listings, metadata } = await query.graph({
    entity: 'listing',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    listings,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
