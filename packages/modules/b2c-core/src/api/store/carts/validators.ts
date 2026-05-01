import { z } from 'zod'

export type StoreDeleteCartShippingMethodsType = z.infer<
  typeof StoreDeleteCartShippingMethods
>
export const StoreDeleteCartShippingMethods = z.object({
  shipping_method_ids: z.array(z.string())
})


export type StoreAddListingToCartType = z.infer<typeof StoreAddListingToCart>
export const StoreAddListingToCart = z
  .object({
    listing_id: z.string().min(1),
    quantity: z.number().int().positive(),
    metadata: z.record(z.unknown()).nullish()
  })
  .strict()
