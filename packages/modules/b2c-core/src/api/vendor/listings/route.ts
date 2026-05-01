import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { LISTING_MODULE, ListingModuleService } from '../../../modules/listing'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { assertProductVariantBelongsToSeller } from './utils'
import {
  VendorCreateListing,
  VendorCreateListingType
} from './validators'

type ResolvedPrintReference = {
  print_id: string
}

type PrintReferenceResolver = {
  resolvePrintReference?: (printId: string) => Promise<ResolvedPrintReference | null>
}

const CATALOG_PRINT_REFERENCE_RESOLVER = 'catalogPrintReferenceResolver'

const resolvePrintReference = async (
  printId: string,
  scope: AuthenticatedMedusaRequest['scope']
): Promise<ResolvedPrintReference> => {
  try {
    const resolver = scope.resolve<PrintReferenceResolver>(
      CATALOG_PRINT_REFERENCE_RESOLVER,
      {
        allowUnregistered: true
      }
    )

    const resolvedPrint = await resolver?.resolvePrintReference?.(printId)

    if (resolvedPrint?.print_id) {
      return resolvedPrint
    }
  } catch {
    // Catalog binding is intentionally optional while the catalog layer is still evolving.
  }

  return {
    print_id: printId
  }
}

const buildCreatePayload = async (
  req: AuthenticatedMedusaRequest<VendorCreateListingType>
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const validatedBody = VendorCreateListing.parse(req.body)

  await assertProductVariantBelongsToSeller(
    req.scope,
    seller.id,
    validatedBody.product_variant_id
  )

  const resolvedPrint = await resolvePrintReference(
    validatedBody.print_id,
    req.scope
  )

  return {
    ...validatedBody,
    print_id: resolvedPrint.print_id,
    seller_id: seller.id
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateListingType>,
  res: MedusaResponse
) => {
  const listingModuleService =
    req.scope.resolve<ListingModuleService>(LISTING_MODULE)

  try {
    const createPayload = await buildCreatePayload(req)

    const listing = await listingModuleService.createListings(createPayload as any)

    const listingData = await refetchEntity(
      'listing',
      listing.id,
      req.scope,
      req.queryConfig.fields
    )

    res.status(201).json({ listing: listingData })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (
      message ===
      'product_variant_id does not belong to the authenticated seller'
    ) {
      res.status(403).json({ message })
      return
    }

    throw error
  }
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
