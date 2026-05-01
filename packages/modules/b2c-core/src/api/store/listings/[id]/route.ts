import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [listing]
  } = await query.graph({
    entity: 'listing',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
      status: 'active'
    }
  })

  if (!listing) {
    return res.status(404).json({
      message: 'Listing not found'
    })
  }

  res.json({
    listing
  })
}
