# Project Snapshot — Storefront Purchase Flow API Contract

Date: 2026-05-04

## Current state

Main was updated after merging PR #49.

PR:

- #49
- Scope: Storefront buyer purchase flow API contract
- Branch merged:
  - docs/storefront-purchase-flow-contract

## What was completed

Added a formal API contract document for the first MVP storefront buyer flow.

Document added:

- `docs/api-contracts/storefront-purchase-flow.md`

The contract documents:

- public listing discovery
- public listing detail
- add marketplace listing to cart
- shipping options for cart
- add shipping method to cart
- payment collection creation
- payment session creation
- cart completion
- buyer order set retrieval
- buyer order detail retrieval

## Validation source

The contract is based on the validated integration test:

- `apps/backend/integration-tests/http/storefront-purchase-flow-contract.spec.ts`

Latest related validation:

- PASS `integration-tests/http/storefront-purchase-flow-contract.spec.ts`
- PASS `integration-tests/http/store-cart-listing-add.spec.ts`
- PASS `integration-tests/http/store-cart-listing-complete.spec.ts`
- PASS `integration-tests/http/store-payment-collections-ownership.spec.ts`
- PASS `integration-tests/http/store-shipping-options-cart-ownership.spec.ts`
- PASS `integration-tests/http/store-order-query.spec.ts`

## Important frontend notes

The current backend contract is enough for the basic buyer flow, but there are frontend-facing gaps before public beta:

- Real payment provider is still pending.
- Listing contract currently exposes marketplace listing fields, but not rich TCG/card/print details.
- Completed order response does not guarantee nested `order.seller`.
- Image/card enrichment contract is still pending.
- Shipping price/timing UX contract is still pending.
- Error normalization for frontend UX is still pending.

## Status

Store ownership hardening is complete.

Storefront purchase flow contract is documented.

Next recommended phase:

- MVP Storefront Readiness Audit:
  - inspect frontend structure,
  - map buyer pages,
  - map API client needs,
  - identify exact missing backend contracts,
  - then implement the smallest frontend/backend bridge to make the buyer MVP usable.
