import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformQuery
} from '@medusajs/framework'

import { storeReturnQueryConfig } from './query-config'
import { StoreGetReturnsParams } from './validators'

export const storeReturnsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/returns',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetReturnsParams,
        storeReturnQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/returns/:id',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformQuery(
        StoreGetReturnsParams,
        storeReturnQueryConfig.retrieve
      )
    ]
  }
]
