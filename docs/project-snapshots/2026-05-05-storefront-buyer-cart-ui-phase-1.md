# Project Snapshot — Storefront Buyer Cart UI Phase 1

Date: 2026-05-05

## Current state

Storefront Buyer Cart UI Phase 1 is complete and merged.

The buyer-facing storefront can now start the add-to-cart flow from listing detail pages.

## Merged scope

Affected app:

- `apps/storefront`

Main areas touched:

- Listing detail purchase panel
- Add-to-cart client component
- Storefront API helpers
- Storefront environment example
- Storefront README
- Storefront CSS

## Buyer cart behavior

The storefront now supports:

- creating a Store API cart from the frontend
- storing the cart id locally in browser storage
- adding an active marketplace listing to the cart
- selecting quantity up to the listing available quantity
- blocking purchase CTA when listing is not purchasable
- showing success/error messages after add-to-cart attempts

## Required frontend environment variables

The storefront local app requires:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MEDUSA_REGION_ID`

Example local values:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable_key>`
- `NEXT_PUBLIC_MEDUSA_REGION_ID=<region_id>`

## Validation completed

Passed:

- `yarn --cwd apps/storefront lint`
- `yarn --cwd apps/storefront build`

## Local testing status

Backend and storefront can run locally:

- `yarn --cwd apps/backend dev`
- `yarn --cwd apps/storefront dev`

Current local blocker:

- local database may have no active marketplace listings yet
- storefront correctly renders an empty state when no active listings exist

## MVP impact

The storefront now has the beginning of buyer intent conversion: listing detail to add to cart.

The next important technical step is to create reliable local demo data so the Storefront can show active listings and the add-to-cart flow can be tested manually from the browser.

## Recommended next phase

Start `chore/storefront-demo-data-seed`.

Scope:

- add a dev/demo seed script for storefront marketplace listings
- create one or more active listings connected to real product variants
- make local browser testing repeatable
- avoid production behavior changes
