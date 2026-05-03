import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

type CheckCartCustomerOwnershipIfBoundOptions<Body> = {
  cartId?: (req: AuthenticatedMedusaRequest<Body>) => string | undefined
}

export const checkCartCustomerOwnershipIfBound = <Body = unknown>({
  cartId = (req) => req.params.id
}: CheckCartCustomerOwnershipIfBoundOptions<Body> = {}) => {
  return async (
    req: AuthenticatedMedusaRequest<Body>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const resolvedCartId = cartId(req)

    if (!resolvedCartId) {
      res.status(404).json({
        message: 'Cart not found',
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    const {
      data: [cart]
    } = await query.graph({
      entity: 'cart',
      fields: ['id', 'customer_id'],
      filters: {
        id: resolvedCartId
      }
    })

    if (!cart) {
      res.status(404).json({
        message: `Cart with id: ${resolvedCartId} not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    if (
      cart.customer_id &&
      cart.customer_id !== req.auth_context?.actor_id
    ) {
      res.status(404).json({
        message: `Cart with id: ${resolvedCartId} not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    next()
  }
}
