# Project Snapshot — Vendor Order Changes API

Date: 2026-05-03

## Current state

Main was updated after merging the Vendor Order Changes API PR.

Scope:

- Vendor Order Changes API integration coverage
- Branch merged:
  - feat/vendor-order-changes-guards

## What was completed

Added integration coverage for vendor order changes ownership and authentication.

New test file:

- apps/backend/integration-tests/http/vendor-order-changes.spec.ts

Covered behavior:

- Authenticated seller can list changes for their own order.
- Authenticated seller can list changes after canceling their own order.
- Seller cannot list changes for another seller's order.
- Order changes route requires authentication.

## Validation

Validated selected backend integration suite:

- integration-tests/http/store-cart-listing-stock-step.spec.ts
- integration-tests/http/store-cart-listing-complete.spec.ts
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

No production route changes were required in this PR.

The existing vendor order middleware already enforced seller ownership for:

- /vendor/orders/:id/changes

This PR makes that behavior explicit and protected by integration tests.

Known noisy test logs:

- Local event bus warnings.
- Notification subscriber errors caused by missing/invalid notification provider test configuration.
- These logs are side effects during order placement and did not fail the validated suites.

## Recent commits around this checkpoint

- test(vendor): cover order changes ownership
- docs: add vendor order fulfillment api snapshot
- test(vendor): cover order fulfillment ownership
- docs: add vendor order actions api snapshot
- test(vendor): cover order action ownership
