import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { enrichStoreListingsWithCatalog } from './catalog-enrichment'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: listings, metadata } = await query.graph({
    entity: 'listing',
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      status: 'active'
    },
    pagination: req.queryConfig.pagination
  })

  const enrichedListings = await enrichStoreListingsWithCatalog(listings)

  res.json({
    listings: enrichedListings,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
