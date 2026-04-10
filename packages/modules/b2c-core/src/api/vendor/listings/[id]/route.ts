import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity
} from '@medusajs/framework'

import { LISTING_MODULE, ListingModuleService } from '../../../../modules/listing'
import { VendorUpdateListingType } from '../validators'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const listing = await refetchEntity(
    'listing',
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ listing })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<VendorUpdateListingType>,
  res: MedusaResponse
) => {
  const listingModuleService =
    req.scope.resolve<ListingModuleService>(LISTING_MODULE)

  await listingModuleService.updateListings({
    id: req.params.id,
    ...req.validatedBody
  } as any)

  const listing = await refetchEntity(
    'listing',
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ listing })
}
