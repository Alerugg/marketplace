import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

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

  res.json({
    listings,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
