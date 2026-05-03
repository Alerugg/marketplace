# Project Snapshot — Store Return Shipping Options Ownership

Date: 2026-05-03

## Current state

Main was updated after merging PR #40.

PR:

- #40
- Scope: Store return shipping options ownership guard
- Branch merged:
  - feat/store-return-shipping-options-ownership-guards

## What was completed

Added customer ownership protection for the Store Return Shipping Options API.

Updated file:

- packages/modules/b2c-core/src/api/store/shipping-options/return/route.ts

New test file:

- apps/backend/integration-tests/http/store-return-shipping-options.spec.ts

Covered behavior:

- Authenticated customer can list return shipping options for their own order.
- Authenticated customer cannot list return shipping options for another customer's order.
- Unauthenticated requests are rejected.

## Implementation notes

The route now verifies that the requested `order_id` belongs to the authenticated customer before running the return shipping options workflow.

If the order does not exist or does not belong to the authenticated customer, the route returns 404.

This avoids leaking whether another customer's order exists.

## Validation

Validated:

- Built b2c-core plugin with `yarn build`
- PASS integration-tests/http/store-return-shipping-options.spec.ts

Known noisy test logs:

- Local event bus warnings.
- Notification subscriber errors caused by missing/invalid notification provider test configuration.
- These logs are side effects during order placement and did not fail the validated suite.

## Recent commits around this checkpoint

- fix(store): guard return shipping options ownership (#40)
- docs: add vendor return actions ownership snapshot
- test(vendor): cover return action ownership (#39)
- docs: add vendor returns ownership snapshot
- test(vendor): cover returns ownership (#38)
