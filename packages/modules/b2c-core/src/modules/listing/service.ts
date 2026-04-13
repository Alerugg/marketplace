import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import { z } from "zod";

import { Listing } from "./models/listing";
import { LISTING_STATUSES } from "./constants";

const listingBaseValidationSchema = z.object({
  price_amount: z.number().positive("price_amount must be greater than 0"),
  quantity_available: z
    .number()
    .int()
    .nonnegative("quantity_available must be greater than or equal to 0"),
  status: z.enum(LISTING_STATUSES, {
    errorMap: () => ({
      message: `status must be one of: ${LISTING_STATUSES.join(", ")}`,
    }),
  }),
});

const listingCreateValidationSchema = listingBaseValidationSchema;
const listingUpdateValidationSchema = listingBaseValidationSchema.partial();

class ListingModuleService extends MedusaService({
  Listing,
}) {
  private validateListingInput = (
    input: Record<string, unknown> | Record<string, unknown>[],
    schema:
      | typeof listingCreateValidationSchema
      | typeof listingUpdateValidationSchema,
  ) => {
    const entries = Array.isArray(input) ? input : [input];

    for (const entry of entries) {
      const validated = schema.safeParse(entry);

      if (!validated.success) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          validated.error.issues.map((issue) => issue.message).join("; "),
        );
      }
    }
  };

  createListings = async (
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) => {
    this.validateListingInput(data, listingCreateValidationSchema);
    // @ts-expect-error createListings exists on MedusaService generated methods
    return super.createListings(data, sharedContext);
  };

  updateListings = async (
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) => {
    this.validateListingInput(data, listingUpdateValidationSchema);
    // @ts-expect-error updateListings exists on MedusaService generated methods
    return super.updateListings(data, sharedContext);
  };
}

export default ListingModuleService;
