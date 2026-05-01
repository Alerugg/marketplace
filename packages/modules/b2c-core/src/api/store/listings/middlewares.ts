import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { storeListingsQueryConfig } from './query-config'
import { StoreGetListingsParams } from './validators'

export const storeListingsMiddlewares: MiddlewareRoute[] = [
  {
    methods: ['GET'],
    matcher: '/store/listings',
    middlewares: [
      validateAndTransformQuery(
        StoreGetListingsParams,
        storeListingsQueryConfig.list
      )
    ]
  },
  {
    methods: ['GET'],
    matcher: '/store/listings/:id',
    middlewares: [
      validateAndTransformQuery(
        StoreGetListingsParams,
        storeListingsQueryConfig.retrieve
      )
    ]
  }
]
