# Project Snapshot — Store Order Detail Ownership

Date: 2026-05-04

## Current state

Main was updated after merging PR #46.

PR:

- #46
- Scope: Store order detail ownership guard
- Branch merged:
  - feat/store-final-ownership-audit

## What was completed

Added customer ownership protection for Store Order detail routes.

Updated Store API behavior:

- `GET /store/orders/:id`
  - Now requires customer authentication.
  - Validates that the requested order belongs to the authenticated customer.
  - Blocks foreign customer access.

- `POST /store/orders/:id/transfer/request`
  - Keeps customer authentication.
  - Adds ownership guard before transfer request action.

- `POST /store/orders/:id/transfer/cancel`
  - Keeps customer authentication.
  - Adds ownership guard before transfer cancel action.

Updated files:

- packages/modules/b2c-core/src/api/store/middlewares.ts
- packages/modules/b2c-core/src/api/store/orders/middlewares.ts
- apps/backend/integration-tests/http/store-order-query.spec.ts
- apps/backend/integration-tests/http/store-order-set-query.spec.ts

## Tests added or updated

New test file:

- apps/backend/integration-tests/http/store-order-query.spec.ts

Coverage added:

- Authenticated customer can retrieve their own order.
- Authenticated customer cannot retrieve another customer order.
- Unauthenticated request cannot retrieve a customer order.

Updated:

- apps/backend/integration-tests/http/store-order-set-query.spec.ts
  - Authenticates customer-bound cart setup flows consistently after the cart/payment ownership hardening.

## Validation performed

- Built b2c-core plugin:
  - `yarn build`

Passing suites:

- integration-tests/http/store-order-query.spec.ts
- integration-tests/http/store-order-set-query.spec.ts
- integration-tests/http/store-cart-customer-ownership.spec.ts

## Notes

This completes the Store ownership hardening pass for the major customer-bound flows covered so far:

- Store return shipping options
- Store return creation
- Store bound cart actions
- Store shipping options by cart
- Store payment collections
- Store standard cart routes
- Store order detail

Tests were run individually because WSL terminal/process instability can occur when running many Medusa integration suites in one loop.
