# Project Snapshot — Store Order Set Ownership API

Date: 2026-05-03

## Current state

Main was updated after merging the Store Order Set Ownership PR.

Branch merged:

- feat/store-order-set-ownership-guards

## What was completed

Added customer authentication and ownership protection to Store Order Set routes.

Changed file:

- packages/modules/b2c-core/src/api/store/order-set/middlewares.ts

New test file:

- apps/backend/integration-tests/http/store-order-set-query.spec.ts

Covered behavior:

- Authenticated customer can list only their own order sets.
- Authenticated customer can retrieve their own order set by ID.
- Customer cannot retrieve another customer's order set.
- Store order set list and detail routes require customer authentication.

## Technical note

The b2c-core plugin was rebuilt locally with:

- yarn build

This was needed because integration tests execute against generated plugin output under:

- packages/modules/b2c-core/.medusa/server

The generated .medusa output is not included in the PR.

## Validation

Validated selected backend integration suite:

- integration-tests/http/store-cart-listing-stock-step.spec.ts
- integration-tests/http/store-cart-listing-complete.spec.ts
- integration-tests/http/store-order-set-query.spec.ts
- integration-tests/http/vendor-listing-query.spec.ts
- integration-tests/http/vendor-listing-update.spec.ts
- integration-tests/http/vendor-listing-actions.spec.ts
- integration-tests/http/vendor-listing-bulk-actions.spec.ts
- integration-tests/http/vendor-order-query.spec.ts
- integration-tests/http/vendor-order-actions.spec.ts
- integration-tests/http/vendor-order-fulfillment.spec.ts
- integration-tests/http/vendor-order-changes.spec.ts

All selected tests passed via:

- /tmp/run-marketplace-tests-safe.sh

## Notes

Known noisy test logs remain present:

- Local event bus warnings.
- Notification subscriber errors caused by missing/invalid notification provider test configuration.
- These logs are side effects during order placement and did not fail the validated suites.

## Recent commits around this checkpoint

- fix(store): guard order set ownership
- docs: add vendor order changes api snapshot
- test(vendor): cover order changes ownership
- docs: add vendor order fulfillment api snapshot
- test(vendor): cover order fulfillment ownership
