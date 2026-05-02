# Marketplace Project Snapshot

## Date
2026-05-02

## Current focus
Marketplace backend MVP — Vendor/Seller Listings API + Storefront/Public Listings API.

## Verified status
The listing backend block is stable and validated.

Validated suites:

- apps/backend/integration-tests/http/vendor-listing-query.spec.ts
- apps/backend/integration-tests/http/vendor-listing-create.spec.ts
- apps/backend/integration-tests/http/vendor-listing-update.spec.ts
- apps/backend/integration-tests/http/vendor-listing-actions.spec.ts
- apps/backend/integration-tests/http/vendor-listing-bulk-actions.spec.ts
- apps/backend/integration-tests/http/store-listing-query.spec.ts

Validation result:

- Backend lint: PASS
- Vendor Listing Query API: PASS
- Vendor Listing Create API: PASS
- Vendor Listing Update API: PASS
- Vendor Listing Actions API: PASS
- Vendor Listing Bulk Actions API: PASS
- Storefront/Public Listing Query API: PASS

## What is now implemented

### Vendor Listings API
Seller-authenticated API for:

- Creating listings
- Listing own seller listings
- Retrieving own listing detail
- Updating mutable listing fields
- Activating listings
- Pausing listings
- Archiving listings
- Selling listings
- Bulk actions

Seller scoping is enforced. Sellers cannot escape scope using seller_id query params or access another seller listing.

### Storefront/Public Listings API
Public/store API for:

- Listing active listings only
- Filtering active listings by seller_id
- Filtering active listings by print_id
- Retrieving active listing detail by id
- Returning not found for non-active listings

Important: store routes require the publishable API key header expected by Medusa store APIs.

## Important testing note
Do not run all Medusa integration specs in one combined Jest process if module loader errors appear like:

Method Map.prototype.set called on incompatible receiver #<Map>

Run specs one by one in separate Jest commands.

Recommended validation command:

cd apps/backend
export NODE_OPTIONS=--experimental-vm-modules

for spec in \
  integration-tests/http/vendor-listing-query.spec.ts \
  integration-tests/http/vendor-listing-create.spec.ts \
  integration-tests/http/vendor-listing-update.spec.ts \
  integration-tests/http/vendor-listing-actions.spec.ts \
  integration-tests/http/vendor-listing-bulk-actions.spec.ts \
  integration-tests/http/store-listing-query.spec.ts
do
  yarn jest "$spec" --runInBand || exit 1
done

## Files changed in this step

- packages/modules/b2c-core/src/api/store/listings/query-config.ts
- packages/modules/b2c-core/src/api/store/listings/validators.ts
- packages/modules/b2c-core/src/api/store/listings/route.ts
- packages/modules/b2c-core/src/api/store/listings/[id]/route.ts
- packages/modules/b2c-core/src/api/store/listings/middlewares.ts
- packages/modules/b2c-core/src/api/store/middlewares.ts
- apps/backend/integration-tests/http/store-listing-query.spec.ts
- docs/PROJECT_SNAPSHOT.md

## Next recommended phase
Move to cart/buy flow integration for listings:

1. Decide how listing_id maps into cart line items.
2. Validate stock reservation/decrement behavior.
3. Prevent checkout of inactive/sold/archived listings.
4. Add storefront product/card detail composition later, once catalog binding is finalized.

## Latest update — 2026-05-02

### Listing product variant binding
Implemented product_variant_id support on listings so marketplace listings can be connected to Medusa product variants.

Validated:
- Listing migration adds product_variant_id
- Listing model exposes product_variant_id
- Vendor listing create/query supports product_variant_id
- Store listing query exposes product_variant_id

### Store cart listing add API
Implemented:

POST /store/carts/:id/listings

Behavior:
- Accepts listing_id, quantity and optional metadata
- Only active listings can be added
- Listing must have product_variant_id
- Quantity cannot exceed listing quantity_available
- Adds the underlying product variant to the Medusa cart
- Persists marketplace listing metadata on the cart line item:
  - marketplace_listing_id
  - listing_id
  - print_id
  - seller_id

Validated:
- Backend lint: PASS
- Store cart listing add integration test: PASS
- Store public listing query integration test: PASS
