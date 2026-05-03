import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { retrieveTransformQueryConfig } from '@medusajs/medusa/api/store/returns/query-config'
import {
  ReturnsParams,
  StorePostReturnsReqSchema
} from '@medusajs/medusa/api/store/returns/validators'

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
    method: ['POST'],
    matcher: '/store/returns',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      validateAndTransformBody(StorePostReturnsReqSchema),
      validateAndTransformQuery(ReturnsParams, retrieveTransformQueryConfig)
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
