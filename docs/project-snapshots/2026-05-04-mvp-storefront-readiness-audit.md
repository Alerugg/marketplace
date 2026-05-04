# Project Snapshot — MVP Storefront Readiness Audit

Date: 2026-05-04

## Current state

The Store ownership/security hardening phase is complete.

The Storefront Purchase Flow integration contract is complete and documented.

Relevant merged work:

- Store cart customer ownership guards
- Store shipping options cart ownership guards
- Store payment collection ownership guards
- Store standard cart ownership guards
- Store order detail ownership guards
- Store remaining ownership audit snapshot
- Storefront purchase flow contract test
- Storefront purchase flow API contract

## Audit result

The repository currently contains backend/API code only.

There is no dedicated frontend/storefront application inside:

- `apps/frontend`
- `apps/storefront`
- `apps/web`
- or equivalent

The current marketplace repository therefore cannot yet implement the buyer UI directly unless a frontend app is added or connected from another repository.

## Backend buyer flow status

The backend supports the minimum public buyer purchase flow:

1. Public listing discovery
   - `GET /store/listings`

2. Public active listing detail
   - `GET /store/listings/:id`

3. Add listing to cart
   - `POST /store/carts/:id/listings`

4. List shipping options for cart
   - `GET /store/shipping-options?cart_id=...`

5. Add shipping method to cart
   - `POST /store/carts/:id/shipping-methods`

6. Create payment collection
   - `POST /store/payment-collections`

7. Create payment session
   - `POST /store/payment-collections/:id/payment-sessions`

8. Complete cart
   - `POST /store/carts/:id/complete`

9. Retrieve buyer order set
   - `GET /store/order-set`
   - `GET /store/order-set/:id`

10. Retrieve buyer order detail
   - `GET /store/orders/:id`

## Existing validation

The following integration contract is passing:

- `apps/backend/integration-tests/http/storefront-purchase-flow-contract.spec.ts`

Related suites were also validated during the hardening phase:

- `store-cart-listing-add.spec.ts`
- `store-cart-listing-complete.spec.ts`
- `store-payment-collections-ownership.spec.ts`
- `store-shipping-options-cart-ownership.spec.ts`
- `store-order-query.spec.ts`

## MVP frontend blockers

The backend buyer flow is technically usable, but not yet product-complete for a real storefront.

Main blockers:

### 1. No frontend app in this repo

There is no storefront UI to wire against the documented API contract.

Decision needed:

- create a new storefront app in this repo,
- or connect this backend to an external frontend repo.

### 2. Public listings are too raw for storefront UX

Current public listing fields include marketplace listing data such as:

- `print_id`
- `product_variant_id`
- `seller_id`
- `price_amount`
- `condition_code`
- `quantity_available`
- `photos`

But a real TCG storefront also needs enriched catalog data such as:

- card name
- game
- set name/code
- collector number
- rarity
- card image
- print image
- normalized display title
- seller/store display data

### 3. Payment provider is still test/system provider

Current validated provider:

- `pp_system_default`

Real MVP will need Stripe/payment-provider readiness.

### 4. Order response hydration is limited

The completed cart response returns an `order_set`, but does not guarantee nested `order.seller`.

Frontend must not depend on `order.seller` until backend explicitly adds it to the contract.

### 5. Error contract needs frontend normalization

Known errors exist, but frontend-friendly error mapping is not yet formalized.

Examples:

- listing not found
- listing unavailable
- quantity unavailable
- cart ownership errors
- shipping option errors
- payment session errors

## Recommended next phase

Next backend phase should be:

# Storefront Listing Enrichment Contract

Goal:

Make `GET /store/listings` and `GET /store/listings/:id` useful for a real TCG storefront.

Recommended first implementation:

- inspect listing module catalog binding
- determine whether catalog/card/print data is already stored or linked
- enrich public listing responses with a stable `catalog` or `print` object
- add integration tests for enriched listing fields
- update `docs/api-contracts/storefront-purchase-flow.md`

## Suggested next PR

Title:

- `feat(store): enrich storefront listing contract`

Scope:

- backend only
- public Store listing API
- no ownership/security changes
- no frontend code

