import { z } from "zod";

import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { LISTING_STATUSES } from "../../../modules/listing/constants";

const listingStatusEnum = z.enum(LISTING_STATUSES);
const requiredPrintIdSchema = z
  .string({
    required_error: "print_id is required",
    invalid_type_error: "print_id is required",
  })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: "print_id is required",
  });

const listingFilterableFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  print_id: z.union([z.string(), z.array(z.string())]).optional(),
  condition_code: z.union([z.string(), z.array(z.string())]).optional(),
  currency_code: z.union([z.string(), z.array(z.string())]).optional(),
  status: listingStatusEnum.optional(),
});

export type VendorGetListingsParamsType = z.infer<
  typeof VendorGetListingsParams
>;
export const VendorGetListingsParams = createFindParams({
  limit: 20,
  offset: 0,
})
  .merge(listingFilterableFields)
  .merge(applyAndAndOrOperators(listingFilterableFields));

export type VendorCreateListingType = z.infer<typeof VendorCreateListing>;
export const VendorCreateListing = z
  .object({
    print_id: requiredPrintIdSchema,
    price_amount: z.number().positive(),
    currency_code: z.string(),
    condition_code: z.string(),
    quantity_available: z.number().int().nonnegative(),
    status: listingStatusEnum,
    seller_note: z.string().nullish(),
    photos: z.array(z.string()).nullish(),
    location_country: z.string().nullish(),
    shipping_profile_id: z.string().nullish(),
  })
  .strict();

export type VendorUpdateListingType = z.infer<typeof VendorUpdateListing>;
export const VendorUpdateListing = z
  .object({
    print_id: z.string().optional(),
    price_amount: z.number().positive().optional(),
    currency_code: z.string().optional(),
    condition_code: z.string().optional(),
    quantity_available: z.number().int().nonnegative().optional(),
    status: listingStatusEnum.optional(),
    seller_note: z.string().nullish(),
    photos: z.array(z.string()).nullish(),
    location_country: z.string().nullish(),
    shipping_profile_id: z.string().nullish(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Object.prototype.hasOwnProperty.call(value, "print_id")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "print_id cannot be updated for an existing listing",
        path: ["print_id"],
      });
    }
  });
