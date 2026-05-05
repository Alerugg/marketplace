# Project Snapshot — Storefront Cart Page Phase 1

Date: 2026-05-05

## Current state

Storefront Cart Page Phase 1 is complete and merged.

The buyer-facing storefront now supports a basic guest/local cart flow:

- buyer opens a listing detail page
- buyer adds an active marketplace listing to cart
- storefront stores the cart id in browser localStorage
- buyer can open /cart
- cart page fetches the Medusa cart
- cart page hydrates marketplace listing metadata from Store Listing API
- cart page displays listing photo, condition, seller note, quantity, and listing price

## Merged scope

Affected app:

- apps/storefront

Main areas touched:

- cart page route
- CartView client component
- Header navigation
- AddToCartForm cart link behavior
- storefront cart API helpers
- listing image priority
- cart CSS

## Important product decision

Marketplace listing photos must have priority over catalog photos.

Reason:

- catalog image represents the card/print reference
- marketplace listing photo represents the real item uploaded by the seller
- buyer trust depends on seeing the seller-uploaded listing photos

Current priority:

1. listing.photos[0]
2. listing.catalog.primary_image_url
3. listing.catalog.image_url

## Current cart behavior

The cart is currently guest/localStorage based.

This is acceptable for MVP browsing and early cart testing, but it is not enough for real checkout.

Before checkout/payment production work, the project needs a buyer account/login flow.

## Known limitation

There is currently no visible account creation or login flow in the storefront.

This means a buyer can add to cart as guest, but the checkout journey still needs:

- account creation
- login
- customer session handling
- cart/customer association
- later unified identity with catalog + marketplace

## Validation completed

Passed:

- yarn --cwd apps/storefront lint
- yarn --cwd apps/storefront build

Manual validation:

- storefront loaded active demo listings
- listing detail add-to-cart worked
- /cart rendered the selected listing
- backend received Store API cart/listing requests successfully

## Recommended next phase

Start feat/storefront-auth-gate-phase-1.

Goal:

Define and implement the minimum buyer auth/account foundation needed before checkout.

Suggested scope:

1. Inspect existing Medusa/customer auth routes.
2. Confirm current customer registration/login contract.
3. Add storefront account/login/register pages if backend already supports them.
4. Add auth-aware header state.
5. Add customer session helper functions.
6. Add cart/customer association only after login works.
7. Keep checkout/payment disabled until auth and cart ownership are clear.

Do not start visual redesign yet.

Do not start payment checkout yet.
