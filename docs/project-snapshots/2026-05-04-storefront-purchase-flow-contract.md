# Project Snapshot — Storefront Purchase Flow Contract

Date: 2026-05-04

## Current state

Store ownership/security hardening phase is complete.

A storefront purchase flow contract test was added and merged.

Relevant PR:

- #48
- Scope: Storefront buyer purchase flow contract
- Branch merged:
  - feat/storefront-purchase-flow-contract-audit

## What was completed

Added integration coverage for the minimum public storefront purchase flow:

- public active listing discovery
- active listing detail
- hidden draft listing detail
- add listing to cart
- list shipping options for cart
- add seller shipping method
- create payment collection
- create payment session
- complete cart
- receive order set response

## Validation

Passed:

- integration-tests/http/storefront-purchase-flow-contract.spec.ts
- integration-tests/http/store-cart-listing-add.spec.ts
- integration-tests/http/store-cart-listing-complete.spec.ts
- integration-tests/http/store-payment-collections-ownership.spec.ts
- integration-tests/http/store-shipping-options-cart-ownership.spec.ts
- integration-tests/http/store-order-query.spec.ts

## Notes

No production code changed in this PR.

The contract intentionally does not assert `order.seller`, because current completed order payload does not hydrate nested `seller` in that response.

## Next recommended phase

Move from Store API hardening into MVP readiness:

1. API contract cleanup
2. Storefront frontend buyer flow
3. Seller portal operational flow
4. Real payment/refund/shipping states
5. Deployment/CI/readiness
