import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

export const checkCartCustomerOwnershipIfBound = () => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartId = req.params.id

    const {
      data: [cart]
    } = await query.graph({
      entity: 'cart',
      fields: ['id', 'customer_id'],
      filters: {
        id: cartId
      }
    })

    if (!cart) {
      res.status(404).json({
        message: `Cart with id: ${cartId} not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    if (
      cart.customer_id &&
      cart.customer_id !== req.auth_context?.actor_id
    ) {
      res.status(404).json({
        message: `Cart with id: ${cartId} not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    next()
  }
}
