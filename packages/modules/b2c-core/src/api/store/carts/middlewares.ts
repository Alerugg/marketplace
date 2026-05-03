import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import * as QueryConfig from '@medusajs/medusa/api/store/carts/query-config'
import {
  StoreAddCartShippingMethods,
  StoreGetCartsCart
} from '@medusajs/medusa/api/store/carts/validators'
import * as OrderQueryConfig from '@medusajs/medusa/api/store/orders/query-config'
import { StoreGetOrderParams } from '@medusajs/medusa/api/store/orders/validators'

import { checkCartCustomerOwnershipIfBound } from '../../../shared/infra/http/middlewares/check-cart-customer-ownership'
import {
  StoreAddListingToCart,
  StoreDeleteCartShippingMethods
} from './validators'

const optionalCustomerAuth = authenticate('customer', ['bearer', 'session'], {
  allowUnauthenticated: true
})

const guardCartCustomerIfBound = checkCartCustomerOwnershipIfBound()

export const storeCartsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/carts/:id/listings',
    middlewares: [
      optionalCustomerAuth,
      guardCartCustomerIfBound,
      validateAndTransformBody(StoreAddListingToCart),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/carts/:id/shipping-methods',
    middlewares: [
      optionalCustomerAuth,
      guardCartCustomerIfBound,
      validateAndTransformBody(StoreAddCartShippingMethods),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/carts/:id/shipping-methods',
    middlewares: [
      optionalCustomerAuth,
      guardCartCustomerIfBound,
      validateAndTransformBody(StoreDeleteCartShippingMethods),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/carts/:id/line-items/:line_id',
    middlewares: [
      optionalCustomerAuth,
      guardCartCustomerIfBound,
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/carts/:id/complete',
    middlewares: [
      optionalCustomerAuth,
      guardCartCustomerIfBound,
      validateAndTransformQuery(
        StoreGetOrderParams,
        OrderQueryConfig.retrieveTransformQueryConfig
      )
    ]
  }
]
