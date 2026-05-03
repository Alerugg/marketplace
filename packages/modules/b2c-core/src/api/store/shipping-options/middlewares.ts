import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformQuery
} from '@medusajs/framework'

import { checkCartCustomerOwnershipIfBound } from '../../../shared/infra/http/middlewares/check-cart-customer-ownership'
import {
  listTransformQueryConfig,
  storeGetReturnShippingOptionsQueryConfig
} from './query-config'
import {
  StoreGetReturnShippingOptions,
  StoreGetShippingOptions
} from './validators'

const optionalCustomerAuth = authenticate('customer', ['bearer', 'session'], {
  allowUnauthenticated: true
})

const guardCartCustomerIfBound = checkCartCustomerOwnershipIfBound({
  cartId: (req) =>
    (req.filterableFields as { cart_id?: string } | undefined)?.cart_id
})

export const storeShippingOptionRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/shipping-options',
    middlewares: [
      optionalCustomerAuth,
      validateAndTransformQuery(
        StoreGetShippingOptions,
        listTransformQueryConfig
      ),
      guardCartCustomerIfBound
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/shipping-options/return',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetReturnShippingOptions,
        storeGetReturnShippingOptionsQueryConfig.list
      )
    ]
  }
]
