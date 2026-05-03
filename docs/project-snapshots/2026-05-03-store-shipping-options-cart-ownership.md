# Project Snapshot — Store Shipping Options Cart Ownership

Date: 2026-05-03

## Current state

Main was updated after merging the Store Shipping Options cart ownership PR.

Scope:

- Store shipping options cart ownership guard
- Branch merged:
  - feat/store-shipping-options-cart-ownership

## What was completed

Added customer ownership protection for `GET /store/shipping-options` when the request uses a customer-bound cart.

Updated files:

- packages/modules/b2c-core/src/api/store/shipping-options/middlewares.ts
- packages/modules/b2c-core/src/shared/infra/http/middlewares/check-cart-customer-ownership.ts

New test file:

- apps/backend/integration-tests/http/store-shipping-options-cart-ownership.spec.ts

## Covered behavior

The new coverage validates:

- An authenticated customer can list shipping options for their own bound cart.
- Another customer cannot list shipping options for someone else's bound cart.
- Unauthenticated access is rejected for customer-bound cart shipping options.
- Existing return shipping options behavior remains valid.
- Existing cart ownership and cart completion behavior remains valid.

## Validation

Validated before merge:

- Built b2c-core plugin with `yarn build`
- PASS integration-tests/http/store-shipping-options-cart-ownership.spec.ts
- PASS integration-tests/http/store-return-shipping-options.spec.ts
- PASS integration-tests/http/store-cart-customer-ownership.spec.ts
- PASS integration-tests/http/store-cart-listing-complete.spec.ts

## Notes

Existing noisy logs from local event bus / notification subscribers remain non-blocking.

