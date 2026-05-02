# Project Snapshot — Vendor Order Query API

Date: 2026-05-03

## Current state

Main was updated after merging PR #30.

PR:

- #30
- Scope: Vendor Order Query API integration coverage
- Branch merged:
  - feat/vendor-order-management-api

## What was completed

Added integration coverage for the Vendor Order Query API.

New test file:

- apps/backend/integration-tests/http/vendor-order-query.spec.ts

Covered behavior:

- Vendor can list only orders that belong to their seller.
- Vendor can retrieve their own order by id.
- Vendor cannot retrieve another seller's order.
- Authentication is required for list and detail routes.

## Important implementation detail

The test setup creates:

- A shared marketplace base:
  - sales channel
  - region
  - store
  - publishable API key

Then it creates separate sellers using that base.

This avoids duplicate region/country conflicts.

The test also creates unique service zones per seller instead of reusing the seed helper with a fixed `Europe` name. This avoids duplicate service zone errors when multiple sellers are created inside the same test suite.

## Validation

Selected backend integration tests passed on main:

- integration-tests/http/store-cart-listing-stock-step.spec.ts
- integration-tests/http/store-cart-listing-complete.spec.ts
- integration-tests/http/vendor-listing-query.spec.ts
- integration-tests/http/vendor-listing-update.spec.ts
- integration-tests/http/vendor-listing-actions.spec.ts
- integration-tests/http/vendor-listing-bulk-actions.spec.ts
- integration-tests/http/vendor-order-query.spec.ts

## Notes

During cart completion/order creation tests, logs may show notification/subscriber errors such as missing seller email or invalid notification API key. These are noisy test-environment side effects and did not fail the validated suites.

## Suggested next step

Continue hardening Vendor Order Management API beyond query coverage:

1. Vendor order state actions:
   - cancel own order
   - complete own order
   - reject acting on another seller's order
   - require authentication

2. Vendor fulfillment actions:
   - create fulfillment only for own order
   - reject fulfillment from unauthorized seller
   - validate seller stock location ownership

3. Store/customer order-set access:
   - ensure customers can only access their own order sets
   - add missing auth/ownership tests if not already covered
