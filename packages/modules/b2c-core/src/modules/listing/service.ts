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

const validateListingStateInvariants = (entry: {
  status: string;
  quantity_available: number;
}) => {
  if (entry.status === "active" && entry.quantity_available === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "active listings must have quantity_available greater than 0",
    );
  }

  if (entry.status === "sold" && entry.quantity_available > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "sold listings must have quantity_available equal to 0",
    );
  }
};

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

  private validateListingState = (entry: {
    price_amount: unknown;
    quantity_available: unknown;
    status: unknown;
  }) => {
    const validated = listingCreateValidationSchema.safeParse(entry);

    if (!validated.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        validated.error.issues.map((issue) => issue.message).join("; "),
      );
    }

    validateListingStateInvariants(validated.data);
  };

  createListings = async (
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) => {
    this.validateListingInput(data, listingCreateValidationSchema);

    const entries = Array.isArray(data) ? data : [data];
    for (const entry of entries) {
      this.validateListingState({
        price_amount: entry.price_amount,
        quantity_available: entry.quantity_available,
        status: entry.status,
      });
    }

    // @ts-expect-error createListings exists on MedusaService generated methods
    return super.createListings(data, sharedContext);
  };

  updateListings = async (
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) => {
    this.validateListingInput(data, listingUpdateValidationSchema);

    const entries = Array.isArray(data) ? data : [data];

    for (const entry of entries) {
      if (!entry.id || typeof entry.id !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "id is required for listing updates",
        );
      }

      const listing = await this.retrieveListing(entry.id, undefined, sharedContext);

      this.validateListingState({
        price_amount: entry.price_amount ?? listing.price_amount,
        quantity_available:
          entry.quantity_available ?? listing.quantity_available,
        status: entry.status ?? listing.status,
      });
    }

    // @ts-expect-error updateListings exists on MedusaService generated methods
    return super.updateListings(data, sharedContext);
  };
}

export default ListingModuleService;
