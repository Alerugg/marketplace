import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import { z } from "zod";

import { Listing } from "./models/listing";
import { LISTING_STATUSES, ListingStatus } from "./constants";

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

const listingIdentityValidationSchema = z.object({
  print_id: z
    .string({
      required_error: "print_id is required",
      invalid_type_error: "print_id is required",
    })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "print_id is required",
    }),
});

const listingCreateValidationSchema = listingBaseValidationSchema.merge(
  listingIdentityValidationSchema,
);
const listingUpdateValidationSchema = listingBaseValidationSchema.partial();

const validateListingStateInvariants = (entry: {
  status: ListingStatus;
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

const ALLOWED_STATUS_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ["draft", "active", "paused", "archived"],
  active: ["active", "reserved", "sold", "paused", "archived"],
  reserved: ["reserved", "active", "sold", "paused", "archived"],
  sold: ["sold", "archived"],
  paused: ["paused", "active", "archived"],
  archived: ["archived"],
};

class ListingModuleService extends MedusaService({
  Listing,
}) {
  private assertStatusTransition = (
    currentStatus: ListingStatus,
    nextStatus: ListingStatus,
  ) => {
    if (!ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  };

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

  private assertStockMutationAllowed = (entry: {
    status: ListingStatus;
    quantity_available: number;
  }) => {
    if (entry.status === "sold") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "sold listings cannot be mutated",
      );
    }
    if (entry.status === "archived") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "archived listings cannot be mutated",
      );
    }
  };

  async createListings(
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) {
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
  }

  async updateListings(
    data: Record<string, unknown> | Record<string, unknown>[],
    sharedContext?: any,
  ) {
    this.validateListingInput(data, listingUpdateValidationSchema);

    const entries = Array.isArray(data) ? data : [data];

    for (const entry of entries) {
      if (Object.prototype.hasOwnProperty.call(entry, "print_id")) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "print_id cannot be updated for an existing listing",
        );
      }

      if (!entry.id || typeof entry.id !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "id is required for listing updates",
        );
      }

      const listing = await this.retrieveListing(entry.id, undefined, sharedContext);
      const currentStatus = listing.status as ListingStatus;
      const nextStatus = (entry.status ?? listing.status) as ListingStatus;
      this.assertStatusTransition(currentStatus, nextStatus);

      this.validateListingState({
        price_amount: entry.price_amount ?? listing.price_amount,
        quantity_available:
          entry.quantity_available ?? listing.quantity_available,
        status: entry.status ?? listing.status,
      });
    }

    // @ts-expect-error updateListings exists on MedusaService generated methods
    return super.updateListings(data, sharedContext);
  }

  decrementListingQuantity = async (
    data: { id: string; quantity: number; next_status?: ListingStatus },
    sharedContext?: any,
  ) => {
    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "quantity must be an integer greater than 0",
      );
    }

    const listing = await this.retrieveListing(data.id, undefined, sharedContext);
    this.assertStockMutationAllowed({
      status: listing.status as ListingStatus,
      quantity_available: listing.quantity_available,
    });

    if (listing.quantity_available < data.quantity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "insufficient quantity_available for decrement",
      );
    }

    const quantity_available = listing.quantity_available - data.quantity;
    const resolvedStatus =
      data.next_status ?? (quantity_available === 0 ? "sold" : listing.status);

    this.assertStatusTransition(
      listing.status as ListingStatus,
      resolvedStatus as ListingStatus,
    );

    this.validateListingState({
      price_amount: listing.price_amount,
      quantity_available,
      status: resolvedStatus,
    });

    return this.updateListings(
      {
        id: data.id,
        quantity_available,
        status: resolvedStatus,
      },
      sharedContext,
    );
  };

  reserveListing = async (id: string, sharedContext?: any) => {
    const listing = await this.retrieveListing(id, undefined, sharedContext);
    this.assertStatusTransition(listing.status as ListingStatus, "reserved");
    this.validateListingState({
      price_amount: listing.price_amount,
      quantity_available: listing.quantity_available,
      status: "reserved",
    });
    return this.updateListings({ id, status: "reserved" }, sharedContext);
  };

  sellListing = async (id: string, sharedContext?: any) => {
    const listing = await this.retrieveListing(id, undefined, sharedContext);
    this.assertStatusTransition(listing.status as ListingStatus, "sold");
    this.validateListingState({
      price_amount: listing.price_amount,
      quantity_available: 0,
      status: "sold",
    });
    return this.updateListings(
      {
        id,
        quantity_available: 0,
        status: "sold",
      },
      sharedContext,
    );
  };
}

export default ListingModuleService;
