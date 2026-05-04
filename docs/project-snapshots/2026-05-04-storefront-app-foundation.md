# Project Snapshot — Storefront App Foundation

Date: 2026-05-04

## Current state

The buyer-facing storefront foundation is complete and merged.

A new Next.js app now exists at:

- `apps/storefront`

The app connects to the existing Marketplace Store API and can render public active listings and listing detail pages.

## Merged scope

Added storefront app files:

- `apps/storefront/app/page.js`
- `apps/storefront/app/listings/[id]/page.js`
- `apps/storefront/components/Header.js`
- `apps/storefront/components/ListingCard.js`
- `apps/storefront/lib/api.js`
- `apps/storefront/app/globals.css`
- `apps/storefront/.env.example`
- `apps/storefront/README.md`
- `apps/storefront/package.json`
- `apps/storefront/next.config.js`

## Storefront API usage

The app consumes:

- `GET /store/listings`
- `GET /store/listings/:id`

Required frontend environment variables:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

Example local values:

`NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable_key>`

## Catalog behavior

The frontend treats `listing.catalog` as nullable.

When catalog metadata exists, the UI can use:

- `catalog.card_name`
- `catalog.game_slug`
- `catalog.set_code`
- `catalog.collector_number`
- `catalog.rarity`
- `catalog.primary_image_url`

Fallbacks remain based on listing fields:

- `listing.print_id`
- `listing.photos`
- `listing.price_amount`
- `listing.currency_code`
- `listing.condition_code`
- `listing.quantity_available`

## Cleanup completed

A follow-up cleanup removed committed Next.js build output from:

- `apps/storefront/.next`

A local app-level `.gitignore` now ignores:

- `.next`
- `out`
- `node_modules`
- local env files

The storefront lint setup was stabilized for the monorepo and Next build no longer blocks on the previous ESLint parser warning.

## Validation completed

Passed:

- `yarn --cwd apps/storefront lint`
- `yarn --cwd apps/storefront build`

## MVP impact

The project now has a real buyer-facing app shell.

This unlocks the next phase:

1. Storefront UX Phase 1
2. Listing filters and search params
3. Better card/detail UI
4. Buyer cart flow UI
5. Checkout flow wiring
6. Public seller profile pages

## Recommended next phase

Start `feat/storefront-ux-phase-1`.

Scope should stay frontend-only:

- Improve home/listing grid layout.
- Add basic filters for game, condition, and price/order if backend supports them.
- Add empty/loading/error states.
- Improve listing detail page.
- Keep API contracts unchanged.
