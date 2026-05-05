# Project Snapshot — Storefront Buyer Auth Gate Phase 1

Date: 2026-05-05

## Current state

Storefront Buyer Auth Gate Phase 1 is complete and merged.

The buyer-facing storefront now has a first functional customer account layer for the MVP checkout path.

## Merged scope

Affected app:

- `apps/storefront`

Main areas changed:

- Buyer login page
- Buyer registration page
- Account page
- Header account status
- Cart checkout gate
- Auth token browser storage
- Cart id browser storage
- Store API auth helpers
- Stale cart recovery

## Added routes

- `/account`
- `/account/login`
- `/account/register`

## Buyer auth behavior

The storefront now supports:

- registering a customer auth identity
- creating a Store customer profile
- logging in with email/password
- storing the customer token locally
- showing signed-in/signed-out account state in the header
- signing out locally
- gating checkout progression behind sign-in

## Cart behavior

The storefront now supports:

- guest cart creation
- local cart id persistence
- add-to-cart from listing detail
- cart page display
- cart total summary based on marketplace listing pricing
- stale cart recovery when the saved cart id no longer exists

## Important product note

This is not the final unified Dontripit identity layer.

The long-term product requirement remains:

- one Dontripit account across catalog and marketplace
- one login session
- shared user identity for catalog profile, marketplace buyer, seller profile, wishlist, collection, alerts, orders, and preferences

This phase only adds the first marketplace buyer auth gate required to continue checkout.

## Validation completed

Passed:

- `yarn --cwd apps/storefront lint`
- `yarn --cwd apps/storefront build`

## MVP impact

The storefront buyer flow is now:

1. Browse active listings
2. Open listing detail
3. Add listing to cart
4. View cart
5. Sign in or register before checkout

## Recommended next phase

Start `feat/storefront-shipping-phase-1`.

Scope:

- list available shipping options for the cart
- allow selecting a shipping option
- add shipping method to cart
- refresh cart totals after shipping method selection
- keep payment/checkout completion separate
