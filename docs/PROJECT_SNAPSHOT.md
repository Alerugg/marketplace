# Marketplace Project Snapshot

## Date
2026-05-01

## Current focus
Marketplace backend MVP — Vendor/Seller Listings API.

## Current verified status
The Vendor Listings API block is stable and validated.

Validated suites:

- apps/backend/integration-tests/http/vendor-listing-query.spec.ts
- apps/backend/integration-tests/http/vendor-listing-create.spec.ts
- apps/backend/integration-tests/http/vendor-listing-update.spec.ts
- apps/backend/integration-tests/http/vendor-listing-actions.spec.ts
- apps/backend/integration-tests/http/vendor-listing-bulk-actions.spec.ts

Validation result:

- Backend lint: PASS
- Vendor Listing Query API: 6/6 PASS
- Vendor Listing Create API: 8/8 PASS
- Vendor Listing Update API: 8/8 PASS
- Vendor Listing Actions API: 8/8 PASS
- Vendor Listing Bulk Actions API: 6/6 PASS

Total: 36/36 Vendor Listing tests passing.

## What is now covered

### Seller listing creation
- Authenticated sellers can create draft listings.
- Authenticated sellers can create active listings when stock is greater than 0.
- Create route rejects seller_id in request body.
- Create route rejects empty print_id.
- Create route rejects invalid price_amount.
- Create route rejects negative quantity_available.
- Create route rejects active listings with zero stock.
- Create route requires authentication.

### Seller listing queries
- Authenticated sellers only see their own listings.
- seller_id query param cannot escape authenticated seller scope.
- Listings can be filtered by status.
- Seller can retrieve own listing detail.
- Seller cannot retrieve another seller listing.
- List/detail routes require authentication.

### Seller listing updates
- Seller can update mutable fields on own listing.
- print_id cannot be updated.
- seller_id is rejected in body.
- Invalid price_amount is rejected.
- Negative quantity_available is rejected.
- Active listing cannot be updated to zero stock without changing status.
- Seller cannot update another seller listing.
- Update route requires authentication.

### Seller listing actions
- Seller can activate valid own listing.
- Activation is rejected when quantity_available is 0.
- Seller can pause own listing.
- Seller cannot act on another seller listing.
- Seller can archive own listing.
- Archived listing cannot be reactivated.
- Sell action sets quantity_available to 0 and status sold.
- Action routes require authentication.

### Seller listing bulk actions
- Bulk pause only affects authenticated seller listings.
- Bulk archive only affects authenticated seller listings.
- Bulk activate works for paused listings with stock.
- Listing ids from other sellers are rejected.
- Invalid bulk action is rejected.
- Empty listing_ids array is rejected.

## Runtime notes
Postgres local container:

- Container name: marketplace-postgres
- Port: 5432
- Auto-start should be enabled with:
  docker update --restart unless-stopped marketplace-postgres

Node tests require:

export NODE_OPTIONS=--experimental-vm-modules

## Recommended next MVP block

Next block should be the buyer-facing/public listings API.

Goal:
Expose active marketplace listings for storefront/catalog consumption, while keeping seller-private states hidden.

Suggested test file:
apps/backend/integration-tests/http/storefront-listing-query.spec.ts

Suggested coverage:
- Public/storefront listing list returns only active listings.
- Draft/paused/archived/sold listings are hidden.
- Listings with quantity_available <= 0 are hidden from buyer-facing list.
- Can filter by print_id.
- Can filter/sort by price.
- Can retrieve public listing detail only when listing is active and available.
- Public detail rejects hidden/unavailable listings.
- Response does not expose unsafe/private seller internals.

## Baseline validation command

From apps/backend:

export NODE_OPTIONS=--experimental-vm-modules
yarn lint && yarn jest integration-tests/http/vendor-listing-query.spec.ts integration-tests/http/vendor-listing-create.spec.ts integration-tests/http/vendor-listing-update.spec.ts integration-tests/http/vendor-listing-actions.spec.ts integration-tests/http/vendor-listing-bulk-actions.spec.ts --runInBand
