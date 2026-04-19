import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework";

import {
  LISTING_MODULE,
  ListingModuleService,
} from "../../../../../modules/listing";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const listingModuleService =
    req.scope.resolve<ListingModuleService>(LISTING_MODULE);

  const currentListing = await refetchEntity(
    "listing",
    req.params.id,
    req.scope,
    req.queryConfig.fields,
  );

  await listingModuleService.pauseListing(currentListing.id);

  const listing = await refetchEntity(
    "listing",
    req.params.id,
    req.scope,
    req.queryConfig.fields,
  );

  res.json({ listing });
};