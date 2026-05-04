# Project Snapshot — Storefront Buyer Cart UI Phase 1

Date: 2026-05-05

## Current state

Storefront Buyer Cart UI Phase 1 is complete and merged.

The buyer-facing storefront can now start the buyer intent flow from a public listing detail page into a Store cart.

## Merged scope

Frontend app affected:

- `apps/storefront`

Main files changed:

- `apps/storefront/app/listings/[id]/page.js`
- `apps/storefront/components/AddToCartForm.js`
- `apps/storefront/lib/api.js`
- `apps/storefront/app/globals.css`
- `apps/storefront/.env.example`
- `apps/storefront/README.md`

## Buyer cart behavior added

The listing detail page now includes an add-to-cart UI.

The frontend can:

- Detect whether a listing is purchasable.
- Disable the purchase action when required conditions are missing.
- Create a guest Store cart when no cart id exists.
- Store the cart id in browser `localStorage`.
- Add an active marketplace listing to the cart.
- Send quantity and frontend metadata to the backend.
- Show success and error messages to the buyer.

## API behavior

No backend API contract changes were introduced.

The storefront now uses:

- `POST /store/carts`
- `POST /store/carts/:id/listings`

Existing listing APIs remain in use:

- `GET /store/listings`
- `GET /store/listings/:id`

## Required frontend environment variables

The storefront now requires:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MEDUSA_REGION_ID`

Example local values:

`NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable_key>`
`NEXT_PUBLIC_MEDUSA_REGION_ID=<region_id>`

## Validation completed

Passed:

- `yarn --cwd apps/storefront lint`
- `yarn --cwd apps/storefront build`

## MVP impact

The storefront now supports the first real buyer action.

A buyer can move from browsing a listing to creating or reusing a cart and adding the listing to it.

This is still not checkout-complete. Shipping, cart review, payment collection, payment session, and completion remain separate phases.

## Recommended next phase

Start `feat/storefront-cart-page-phase-1`.

Suggested scope:

1. Add a basic cart page.
2. Read cart id from `localStorage`.
3. Fetch the cart from `GET /store/carts/:id`.
4. Render cart line items.
5. Show marketplace listing metadata from line items.
6. Add basic remove-line-item action if the existing backend route is stable.
7. Keep shipping and checkout out of this phase.

## Notes

- Frontend-only phase.
- Existing Store API contract was reused.
- No backend production code changes.
