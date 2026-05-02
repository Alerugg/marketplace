# Project Snapshot — Listing Cart Stock Concurrency

Date: 2026-05-02

## Current branch/state

Main is updated and clean after merging:

- PR: #29
- Merge commit: fac3a7c
- Title: fix listing stock concurrency on cart completion
- Deleted feature branch:
  - local: feat/listing-cart-stock-concurrency-guards
  - remote: feat/listing-cart-stock-concurrency-guards

## What was completed

The listing stock decrement flow is now concurrency-safe.

Implemented in:

- packages/modules/b2c-core/src/modules/listing/service.ts

Main change:

- `decrementListingQuantity` now uses a transaction-backed flow.
- Internal protected method uses `@InjectTransactionManager`.
- Listing row is selected with `FOR UPDATE`.
- Stock and status mutation happen inside the same transaction.
- Prevents two concurrent cart completions from selling the same single-stock listing.

## Tests added/validated

New concurrency coverage added in:

- apps/backend/integration-tests/http/store-cart-listing-stock-step.spec.ts
- apps/backend/integration-tests/http/store-cart-listing-complete.spec.ts

Covered cases:

- Two direct listing stock decrements racing for one unit:
  - only one succeeds
  - one fails
  - final quantity is 0
  - final status is sold

- Two carts completing at the same time for the same listing with quantity 1:
  - only one cart completes
  - only one order_set is created
  - one cart remains uncompleted
  - final listing quantity is 0
  - final listing status is sold

## Validation result

Safe test runner used:

- /tmp/run-marketplace-tests-safe.sh

Selected suites passed:

- store-cart-listing-stock-step.spec.ts: 6 passed
- store-cart-listing-complete.spec.ts: 7 passed
- vendor-listing-query.spec.ts: 6 passed
- vendor-listing-update.spec.ts: 8 passed
- vendor-listing-actions.spec.ts: 8 passed
- vendor-listing-bulk-actions.spec.ts: 6 passed

Total selected tests:

- 41 passed
- 0 failed

## Current stable backend area

The following marketplace listing/cart blocks are validated:

1. Vendor listing query API
2. Vendor listing update API
3. Vendor listing actions API
4. Vendor listing bulk actions API
5. Store cart listing stock step
6. Store cart listing completion stock guards
7. Listing stock concurrency protection

## Recommended next block

Next logical MVP block:

Vendor/Seller Order Management API

Goal:

Allow sellers to see orders that contain their marketplace listings after cart completion.

Suggested scope:

- Vendor endpoint to list seller orders
- Vendor endpoint to retrieve seller order detail
- Ensure seller can only see orders that include their own listings
- Include listing/order line information needed for fulfillment
- Add integration tests for seller scoping and authentication
