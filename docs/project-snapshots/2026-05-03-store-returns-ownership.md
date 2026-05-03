# Project Snapshot — Store Returns Ownership Guards

Date: 2026-05-03

## Current state

Main was updated after merging PR #35.

PR:

- #35
- Scope: Store Returns ownership and authentication guards
- Branch merged:
  - feat/store-returns-ownership-guards

## What was completed

Added customer authentication and ownership protection for Store Returns routes.

Changed files:

- packages/modules/b2c-core/src/api/store/returns/middlewares.ts
- packages/modules/b2c-core/src/api/store/returns/[id]/route.ts
- apps/backend/integration-tests/http/store-returns-query.spec.ts

Covered behavior:

- Authenticated customer can list only their own returns.
- Authenticated customer can retrieve their own return by ID.
- Customer cannot retrieve a return that belongs to another customer.
- Store returns list and detail routes require authentication.
- Return detail route now responds cleanly when the return is not accessible.

## Validation

Validated selected backend integration suite:

- integration-tests/http/store-cart-listing-stock-step.spec.ts
- integration-tests/http/store-cart-listing-complete.spec.ts
- integration-tests/http/store-order-set-query.spec.ts
- integration-tests/http/store-returns-query.spec.ts
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

The b2c-core plugin was rebuilt with:

- yarn build

This is needed because the integration test runtime uses the generated plugin output under:

- packages/modules/b2c-core/.medusa/server

Known noisy test logs remain:

- Local event bus warnings.
- Notification subscriber errors caused by missing/invalid notification provider test configuration.
- SplitOrderPayment subscriber noise during test order placement/payment events.

These logs did not fail the validated suites.

## Recent commits around this checkpoint

- fix(store): guard returns ownership (#35)
- docs: add store order set ownership snapshot
- fix(store): guard order set ownership (#34)
- docs: add vendor order changes api snapshot
- test(vendor): cover order changes ownership (#33)
