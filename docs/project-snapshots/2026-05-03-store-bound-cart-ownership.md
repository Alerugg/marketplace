# Project Snapshot — Store Bound Cart Ownership

Date: 2026-05-03

## Current state

Main was updated after merging the Store bound cart ownership guard PR.

PR:

- #42
- Scope: Store bound cart customer ownership guard
- Branch merged:
  - feat/store-ownership-audit

## What was completed

Added customer ownership protection for Store cart mutation/completion routes when a cart is already bound to a customer.

Updated files:

- packages/modules/b2c-core/src/api/store/carts/middlewares.ts
- packages/modules/b2c-core/src/shared/infra/http/middlewares/check-cart-customer-ownership.ts

New test file:

- apps/backend/integration-tests/http/store-cart-customer-ownership.spec.ts

## Protected routes

The new guard covers bound carts on:

- POST /store/carts/:id/listings
- POST /store/carts/:id/shipping-methods
- DELETE /store/carts/:id/shipping-methods
- DELETE /store/carts/:id/line-items/:line_id
- POST /store/carts/:id/complete

## Behavior covered

- Authenticated customer can mutate and complete their own bound cart.
- Another authenticated customer cannot mutate or complete a cart owned by someone else.
- Unauthenticated access is rejected for bound cart mutation/completion routes.
- Anonymous/unbound cart flows remain compatible because the guard only applies ownership if the cart has a customer_id.

## Validation

Validated successfully:

- yarn build from packages/modules/b2c-core
- PASS integration-tests/http/store-cart-customer-ownership.spec.ts
- PASS integration-tests/http/store-cart-listing-add.spec.ts
- PASS integration-tests/http/store-cart-listing-complete.spec.ts
- PASS integration-tests/http/store-cart-listing-stock-step.spec.ts

## Notes

The positive DELETE line-item case was intentionally excluded from the new ownership test because the existing deleteSellerLineItemWorkflow currently fails with:

- Service "undefined" was not found.

Foreign/unauthenticated protection for that route remains covered by the guard test.

Existing noisy logs from local event bus / notification subscribers remain non-blocking.
