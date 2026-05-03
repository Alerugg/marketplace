import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from '@medusajs/framework/utils'

type CartOwnershipRequest<Body = unknown> = AuthenticatedMedusaRequest<Body> & {
  validatedBody?: Record<string, any>
  validatedQuery?: Record<string, any>
  filterableFields?: Record<string, any>
}

type CartOwner = {
  id: string
  customer_id?: string | null
}

type CheckCartCustomerOwnershipIfBoundOptions<Body = unknown> = {
  cartId?: (req: CartOwnershipRequest<Body>) => string | undefined
}

export const checkCartCustomerOwnershipIfBound = <Body = unknown>(
  options: CheckCartCustomerOwnershipIfBoundOptions<Body> = {}
) => {
  return async (
    req: AuthenticatedMedusaRequest<Body>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const request = req as CartOwnershipRequest<Body>

    const cartId =
      options.cartId?.(request) ??
      request.params?.id ??
      request.validatedBody?.cart_id ??
      request.validatedQuery?.cart_id ??
      request.filterableFields?.cart_id

    if (!cartId) {
      next()
      return
    }

    let cart: CartOwner | undefined

    try {
      const cartService = req.scope.resolve<any>(Modules.CART)

      cart = await cartService.retrieveCart(cartId, {
        select: ['id', 'customer_id']
      })
    } catch {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

      const {
        data: [queriedCart]
      } = await query.graph({
        entity: 'cart',
        fields: ['id', 'customer_id'],
        filters: {
          id: cartId
        }
      })

      cart = queriedCart as CartOwner | undefined
    }

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
