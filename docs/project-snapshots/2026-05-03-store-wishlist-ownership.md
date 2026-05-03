# Project Snapshot — Store Wishlist Ownership

Date: 2026-05-03

## Current state

Main was updated after merging PR #36.

PR:

- #36
- Scope: Store Wishlist ownership and authentication guards
- Branch merged:
  - feat/store-wishlist-ownership-guards

## What was completed

Added customer authentication and ownership coverage for the Store Wishlist API.

Updated file:

- packages/modules/b2c-core/src/api/store/wishlist/middlewares.ts

New test file:

- apps/backend/integration-tests/http/store-wishlist-query.spec.ts

Covered behavior:

- Authenticated customer can add a product to their wishlist.
- Authenticated customer lists only their own wishlist products.
- Authenticated customer can delete their own wishlist product.
- Customer cannot delete another customer's wishlist product.
- Wishlist list, create, and delete routes require authentication.

## Validation

Validated:

- integration-tests/http/store-wishlist-query.spec.ts

Also validated the selected marketplace backend integration suite including the current store/vendor ownership coverage.

Known noisy test logs:

- Local event bus warnings.
- Notification subscriber errors caused by missing/invalid notification provider test configuration.
- Split order payment subscriber noise in test runs.
- These logs are side effects during order placement and did not fail the validated suites.

## Recent commits around this checkpoint

- fix(store): guard wishlist ownership (#36)
- docs: add store returns ownership snapshot
- fix(store): guard returns ownership (#35)
- docs: add store order set ownership snapshot
- fix(store): guard order set ownership (#34)
