import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformQuery
} from '@medusajs/framework'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import { orderSetQueryConfig } from './query-config'
import { StoreGetOrderSetParams } from './validators'

export const storeOrderSetMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/order-set',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetOrderSetParams,
        orderSetQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/order-set/:id',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetOrderSetParams,
        orderSetQueryConfig.retrieve
      ),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order_set'
      })
    ]
  }
]
