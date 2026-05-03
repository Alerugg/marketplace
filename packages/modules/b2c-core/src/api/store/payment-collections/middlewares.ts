import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import * as queryConfig from '@medusajs/medusa/api/store/payment-collections/query-config'
import {
  StoreCreatePaymentCollection,
  StoreCreatePaymentSession,
  StoreGetPaymentCollectionParams
} from '@medusajs/medusa/api/store/payment-collections/validators'

import { checkCartCustomerOwnershipIfBound } from '../../../shared/infra/http/middlewares/check-cart-customer-ownership'

const optionalCustomerAuth = authenticate('customer', ['bearer', 'session'], {
  allowUnauthenticated: true
})

const guardCartCustomerIfBound = checkCartCustomerOwnershipIfBound({
  cartId: (req) => req.validatedBody?.cart_id
})

export const storePaymentCollectionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/payment-collections',
    middlewares: [
      optionalCustomerAuth,
      validateAndTransformBody(StoreCreatePaymentCollection),
      guardCartCustomerIfBound,
      validateAndTransformQuery(
        StoreGetPaymentCollectionParams,
        queryConfig.retrievePaymentCollectionTransformQueryConfig
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/payment-collections/:id/payment-sessions',
    middlewares: [
      optionalCustomerAuth,
      validateAndTransformBody(StoreCreatePaymentSession),
      validateAndTransformQuery(
        StoreGetPaymentCollectionParams,
        queryConfig.retrievePaymentCollectionTransformQueryConfig
      )
    ]
  }
]
