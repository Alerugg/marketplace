export const LISTING_CATALOG_BINDING_RESOLVER = "listingCatalogBindingResolver";

export type ResolveListingCatalogPrintInput = {
  print_id: string;
};

export type ResolveListingCatalogPrintResult =
  | {
      exists: true;
      print_id: string;
    }
  | {
      exists: false;
    };

export interface ListingCatalogBindingResolver {
  resolveListingCatalogPrint(
    input: ResolveListingCatalogPrintInput,
  ):
    | ResolveListingCatalogPrintResult
    | Promise<ResolveListingCatalogPrintResult>;
}
