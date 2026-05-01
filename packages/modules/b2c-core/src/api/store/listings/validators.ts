import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

const storeListingFilterableFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  print_id: z.union([z.string(), z.array(z.string())]).optional(),
  condition_code: z.union([z.string(), z.array(z.string())]).optional(),
  currency_code: z.union([z.string(), z.array(z.string())]).optional()
})

export type StoreGetListingsParamsType = z.infer<typeof StoreGetListingsParams>

export const StoreGetListingsParams = createFindParams({
  limit: 20,
  offset: 0
})
  .merge(storeListingFilterableFields)
  .merge(applyAndAndOrOperators(storeListingFilterableFields))
