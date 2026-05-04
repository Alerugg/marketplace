# Dontripit Storefront

Buyer-facing storefront app for Dontripit.

## Local development

Copy the example env file:

cp apps/storefront/.env.example apps/storefront/.env.local

Run the app:

yarn --cwd apps/storefront dev

Required environment variables:

- NEXT_PUBLIC_MEDUSA_BACKEND_URL
- NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

The first MVP uses:

- GET /store/listings
- GET /store/listings/:id

Listings must treat listing.catalog as nullable.

## Buyer cart UI

The listing detail page can create a guest Store cart and add an active marketplace listing to it.

Required local env:

- NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
- NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable_key>
- NEXT_PUBLIC_MEDUSA_REGION_ID=<region_id>

The cart id is stored in browser localStorage under:

- dontripit_storefront_cart_id
