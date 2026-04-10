import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

const listingFilterableFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  print_id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  condition_code: z.union([z.string(), z.array(z.string())]).optional(),
  currency_code: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional()
})

export type VendorGetListingsParamsType = z.infer<typeof VendorGetListingsParams>
export const VendorGetListingsParams = createFindParams({
  limit: 20,
  offset: 0
})
  .merge(listingFilterableFields)
  .merge(applyAndAndOrOperators(listingFilterableFields))

export type VendorCreateListingType = z.infer<typeof VendorCreateListing>
export const VendorCreateListing = z
  .object({
    print_id: z.string(),
    seller_id: z.string(),
    price_amount: z.number(),
    currency_code: z.string(),
    condition_code: z.string(),
    quantity_available: z.number().int(),
    status: z.string(),
    seller_note: z.string().nullish(),
    photos: z.array(z.string()).nullish(),
    location_country: z.string().nullish(),
    shipping_profile_id: z.string().nullish()
  })
  .strict()

export type VendorUpdateListingType = z.infer<typeof VendorUpdateListing>
export const VendorUpdateListing = z
  .object({
    print_id: z.string().optional(),
    seller_id: z.string().optional(),
    price_amount: z.number().optional(),
    currency_code: z.string().optional(),
    condition_code: z.string().optional(),
    quantity_available: z.number().int().optional(),
    status: z.string().optional(),
    seller_note: z.string().nullish(),
    photos: z.array(z.string()).nullish(),
    location_country: z.string().nullish(),
    shipping_profile_id: z.string().nullish()
  })
  .strict()
