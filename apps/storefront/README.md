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
