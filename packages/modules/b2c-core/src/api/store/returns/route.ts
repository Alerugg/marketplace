import { createAndCompleteReturnOrderWorkflow } from '@medusajs/core-flows'
import { HttpTypes } from '@medusajs/types'
import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { storeReturnFields } from './query-config'

type StoreCreateReturnBody = HttpTypes.StoreCreateReturn

/**
 * @oas [get] /store/returns
 * operationId: "StoreListReturns"
 * summary: "List Returns"
 * description: "Retrieves a list of returns for the authenticated customer."
 * x-authenticated: true
 * tags:
 *   - Store
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: relations, metadata } = await query.graph({
    entity: 'order',
    fields: storeReturnFields.map((field) => `returns.${field}`),
    filters: {
      customer_id: req.auth_context.actor_id,
      returns: {
        created_at: {
          $ne: null
        }
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    returns: relations.flatMap((relation) => relation.returns),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /store/returns
 * operationId: "StoreCreateReturn"
 * summary: "Create Return"
 * description: "Creates a return for an order owned by the authenticated customer."
 * x-authenticated: true
 * tags:
 *   - Store
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateReturnBody>,
  res: MedusaResponse
) {
  const input = req.validatedBody as StoreCreateReturnBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: ['id', 'customer_id'],
    filters: {
      id: input.order_id
    }
  })

  if (!order || order.customer_id !== req.auth_context.actor_id) {
    res.status(404).json({
      message: `Order with id: ${input.order_id} not found`,
      type: MedusaError.Types.NOT_FOUND
    })
    return
  }

  const workflow = createAndCompleteReturnOrderWorkflow(req.scope)

  const { result } = await workflow.run({
    input
  })

  res.status(200).json({
    return: result
  })
}
