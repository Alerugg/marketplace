# Project Snapshot — Store Payment Collections Ownership

Date: 2026-05-04

## Current state

Main was updated after merging PR #44.

PR:

- #44
- Scope: Store payment collections ownership guard
- Branch merged:
  - feat/store-payment-collections-ownership

## What was completed

Added customer ownership protection for Store Payment Collections flows when the payment flow is tied to a customer-bound cart.

Updated Store API behavior:

- `POST /store/payment-collections`
  - Validates the requested `cart_id`.
  - Allows guest carts.
  - Allows authenticated customers to create/reuse a payment collection for their own customer-bound cart.
  - Rejects another customer's bound cart.

- `POST /store/payment-collections/:id/payment-sessions`
  - Resolves the payment collection back to its cart.
  - Allows payment session creation only when the authenticated customer owns the customer-bound cart.
  - Rejects another customer's payment collection.
  - Rejects unauthenticated access for customer-bound payment collections.

Updated files:

- packages/modules/b2c-core/src/api/store/middlewares.ts
- packages/modules/b2c-core/src/api/store/payment-collections/route.ts
- packages/modules/b2c-core/src/api/store/payment-collections/middlewares.ts
- packages/modules/b2c-core/src/api/store/payment-collections/[id]/payment-sessions/route.ts
- packages/modules/b2c-core/src/shared/infra/http/middlewares/check-cart-customer-ownership.ts

Updated tests:

- apps/backend/integration-tests/http/store-cart-customer-ownership.spec.ts
- apps/backend/integration-tests/http/store-return-create.spec.ts
- apps/backend/integration-tests/http/store-return-shipping-options.spec.ts
- apps/backend/integration-tests/http/store-returns-query.spec.ts

New test file:

- apps/backend/integration-tests/http/store-payment-collections-ownership.spec.ts

## Validation completed

- Built b2c-core plugin with `yarn build`
- PASS integration-tests/http/store-payment-collections-ownership.spec.ts
- PASS integration-tests/http/store-cart-customer-ownership.spec.ts
- PASS integration-tests/http/store-cart-listing-complete.spec.ts
- PASS integration-tests/http/store-return-create.spec.ts
- PASS integration-tests/http/store-return-shipping-options.spec.ts
- PASS integration-tests/http/store-returns-query.spec.ts

## Notes

Tests were run individually because grouped integration runs were causing WSL terminal/process instability.

Existing noisy logs from local event bus / notification subscribers remain non-blocking.
