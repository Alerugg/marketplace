# Storefront Listing Catalog Enrichment Contract

Date: 2026-05-04

## Purpose

This contract defines how public storefront listings expose TCG catalog metadata for buyer-facing UI.

## Endpoints

- `GET /store/listings`
- `GET /store/listings/:id`

## Response behavior

Every returned listing includes either `catalog: null` or a resolved catalog object.

Expected `listing.catalog` fields when resolved:

- `print_id`
- `game`
- `game_slug`
- `game_name`
- `card_id`
- `card_name`
- `set_id`
- `set_code`
- `set_name`
- `collector_number`
- `language`
- `rarity`
- `is_foil`
- `variant`
- `image_url`
- `primary_image_url`
- `print_key`
- `external_ids`

## Required marketplace environment variables

Catalog enrichment is enabled only when both variables exist:

- `CATALOG_API_URL=http://localhost:5000`
- `CATALOG_API_KEY=<api-project-key>`

If either variable is missing, the Store API must not fail. It should return storefront listings with `catalog: null`.

## Frontend rules

Frontend must treat `listing.catalog` as nullable.

Safe display fallback rules:

- Card title: `listing.catalog.card_name` or `listing.print_id`
- Image: `listing.catalog.primary_image_url` or first `listing.photos[]`
- Set: `listing.catalog.set_code` or hidden
- Rarity: `listing.catalog.rarity` or hidden
- Collector number: `listing.catalog.collector_number` or hidden
- Price: always use listing fields
- Condition: always use listing fields
- Quantity: always use listing fields

## Validation

- `cd ~/projects/marketplace/apps/backend && yarn test:integration:http integration-tests/http/store-listing-query.spec.ts`
- `cd ~/projects/marketplace/apps/backend && yarn test:integration:http integration-tests/http/storefront-purchase-flow-contract.spec.ts`
