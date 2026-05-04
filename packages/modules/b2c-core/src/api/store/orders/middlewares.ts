import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import * as QueryConfig from '@medusajs/medusa/api/store/orders/query-config'
import {
  StoreCancelOrderTransferRequest,
  StoreGetOrderParams,
  StoreRequestOrderTransfer
} from '@medusajs/medusa/api/store/orders/validators'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'

const guardOrderCustomerOwnership = checkCustomerResourceOwnershipByResourceId({
  entryPoint: 'order'
})

export const storeOrderMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/orders/:id',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetOrderParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
      guardOrderCustomerOwnership
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/orders/:id/transfer/request',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformBody(StoreRequestOrderTransfer),
      validateAndTransformQuery(
        StoreGetOrderParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
      guardOrderCustomerOwnership
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/orders/:id/transfer/cancel',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformBody(StoreCancelOrderTransferRequest),
      validateAndTransformQuery(
        StoreGetOrderParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
      guardOrderCustomerOwnership
    ]
  }
]
