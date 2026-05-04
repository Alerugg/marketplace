# Project Snapshot — Storefront Listing Catalog Enrichment

Date: 2026-05-04

## Current state

The storefront listing catalog enrichment phase is complete and merged.

The marketplace Store API now enriches public active listing responses with catalog metadata when the external catalog API is configured.

## Merged scope

Affected endpoints:

- `GET /store/listings`
- `GET /store/listings/:id`

New behavior:

- Each storefront listing includes a `catalog` field.
- When catalog enrichment succeeds, `catalog` contains normalized TCG catalog data.
- When catalog enrichment is not configured or fails, `catalog` is returned as `null`.
- Existing listing ownership and security behavior was not changed.
- No database schema changes were introduced.

## External dependency

Marketplace now optionally depends on the API-PROJECT catalog resolve endpoint:

- `POST /api/prints/resolve`
- `POST /api/catalog/prints/resolve`
- `POST /api/v1/prints/resolve`

Required marketplace environment variables for enrichment:

- `CATALOG_API_URL`
- `CATALOG_API_KEY`

If either variable is missing, storefront listings still work and return `catalog: null`.

## Validation completed

Targeted marketplace tests passed:

- `yarn test:integration:http integration-tests/http/store-listing-query.spec.ts`
- `yarn test:integration:http integration-tests/http/storefront-purchase-flow-contract.spec.ts`

## MVP impact

This removes the biggest Storefront UX blocker for public listing display.

The buyer frontend can now render real TCG listing cards using card name, game, set, collector number, rarity, image, condition, price, and available quantity.

## Recommended next phase

Next phase should be Storefront App Foundation: create the buyer-facing storefront application skeleton and connect it to the existing Store API.
