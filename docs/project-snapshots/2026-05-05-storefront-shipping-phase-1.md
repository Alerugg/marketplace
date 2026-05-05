# Storefront Shipping Phase 1 Snapshot

Date: 2026-05-05  
Branch: feat/storefront-shipping-phase-1

## Summary

Implemented the first functional shipping step in the MVP buyer flow.

The storefront cart now supports:

- Auth-aware buyer cart flow.
- Delivery address form.
- Saving shipping and billing address to the Medusa cart.
- Fetching seller shipping options from the backend.
- Selecting a shipping option.
- Applying the selected shipping method to the cart.
- Displaying shipping total in the order summary.
- Displaying buyer total as listings subtotal + shipping.
- Editing cart line item quantities.
- Removing cart line items.

## Confirmed manual behavior

Validated in browser:

- Cart loads selected marketplace listing.
- Quantity can be edited from cart.
- Quantity total recalculates correctly.
- Shipping address can be saved.
- Shipping options load correctly.
- MercurJS Store shipping appears as an available option.
- Applying shipping updates summary:
  - Listings subtotal: €118.50
  - Shipping: €10.00
  - Buyer total: €128.50
- Shipping selected badge appears after applying shipping.

## Backend endpoints used

Existing Medusa/Mercur storefront endpoints were used:

- GET /store/carts/:id
- POST /store/carts/:id
- POST /store/carts/:id/listings
- POST /store/carts/:id/line-items/:line_id
- DELETE /store/carts/:id/line-items/:line_id
- GET /store/shipping-options?cart_id=:cart_id
- POST /store/carts/:id/shipping-methods

No parallel cart system was introduced.

## Frontend files changed

- apps/storefront/components/CartView.js
- apps/storefront/components/ShippingStep.js
- apps/storefront/components/AddToCartForm.js
- apps/storefront/components/AuthPageGuard.js
- apps/storefront/lib/api.js
- apps/storefront/app/globals.css
- apps/storefront/app/account/login/page.js
- apps/storefront/app/account/register/page.js

## Validation

- yarn --cwd apps/storefront lint
- yarn --cwd apps/storefront build

Both must pass before merge.

## Known remaining work

Payment is still disabled intentionally.

Next recommended phase:

1. Payment collection phase.
2. Payment provider selection.
3. Cart completion.
4. Order confirmation page.
5. Reconcile marketplace listing price vs Medusa variant price before enabling real payment.
6. Improve image fallback for demo listings with broken external image URLs.
7. Minor UI polish: disable or relabel the shipping button once selected.
