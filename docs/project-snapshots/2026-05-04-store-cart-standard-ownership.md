# Project Snapshot — Store Cart Standard Ownership Guards

Date: 2026-05-04

## Current state

Main was updated after merging PR #45.

PR:

- #45
- Scope: Store standard cart ownership guards
- Branch merged:
  - feat/store-cart-standard-ownership-guards

## What was completed

Added customer ownership protection to standard Store Cart routes when the cart is customer-bound.

Protected routes:

- `GET /store/carts/:id`
- `POST /store/carts/:id`
- `POST /store/carts/:id/customer`
- `POST /store/carts/:id/line-items`
- `POST /store/carts/:id/line-items/:line_id`
- `POST /store/carts/:id/promotions`
- `DELETE /store/carts/:id/promotions`
- `POST /store/carts/:id/taxes`

Already protected routes kept covered:

- `POST /store/carts/:id/listings`
- `POST /store/carts/:id/shipping-methods`
- `DELETE /store/carts/:id/shipping-methods`
- `DELETE /store/carts/:id/line-items/:line_id`
- `POST /store/carts/:id/complete`

## Behavior

- Guest carts remain compatible.
- Customer-bound carts can only be accessed/mutated by the authenticated owner.
- Foreign customer access is rejected.
- Unauthenticated access to customer-bound carts is rejected.
- Responses intentionally avoid leaking ownership details by returning not-found style errors where appropriate.

## Updated files

- packages/modules/b2c-core/src/api/store/carts/middlewares.ts
- apps/backend/integration-tests/http/store-cart-customer-ownership.spec.ts

## Validation

The following were validated before merge:

- `yarn build` in `packages/modules/b2c-core`
- PASS `integration-tests/http/store-cart-customer-ownership.spec.ts`
- PASS `integration-tests/http/store-cart-listing-add.spec.ts`
- PASS `integration-tests/http/store-cart-listing-complete.spec.ts`
- PASS `integration-tests/http/store-payment-collections-ownership.spec.ts`
- PASS `integration-tests/http/store-return-create.spec.ts`
- PASS `integration-tests/http/store-return-shipping-options.spec.ts`
- PASS `integration-tests/http/store-returns-query.spec.ts`
- PASS `integration-tests/http/store-shipping-options-cart-ownership.spec.ts`

## Notes

Tests were run individually because long multi-file test loops can destabilize the WSL terminal/process session.

## Recommended next step

Continue the ownership audit with remaining Store/B2C surfaces, especially any routes that accept cart/order/payment/return/customer identifiers and are still relying only on default Medusa behavior or unguarded local workflows.
