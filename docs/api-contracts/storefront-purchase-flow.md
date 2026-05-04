# API Contract — Storefront Purchase Flow

Date: 2026-05-04

## Purpose

This document defines the current backend contract required by the storefront buyer purchase flow.

It is based on the validated integration test:

- apps/backend/integration-tests/http/storefront-purchase-flow-contract.spec.ts

The goal is to give the frontend a stable contract for the first MVP buyer flow.

---

## 1. Public listing discovery

Endpoint:

- GET /store/listings

Auth:

- Public Store route with publishable API key.

Required header:

- x-publishable-api-key: <publishable_key>

Supported filters:

- limit
- offset
- id
- seller_id
- print_id
- condition_code
- currency_code

Behavior:

- Returns only active listings.
- Non-active listings must not be exposed.

Response shape:

- listings: StoreListing[]
- count?: number
- offset?: number
- limit?: number

Required StoreListing fields:

- id
- print_id
- product_variant_id
- seller_id
- price_amount
- currency_code
- condition_code
- quantity_available
- status
- seller_note
- photos
- location_country
- shipping_profile_id
- created_at
- updated_at

Important:

- Storefront must treat only status=active as purchasable.
- Draft, paused, archived, or sold listings must not be exposed through public listing detail.

---

## 2. Public listing detail

Endpoint:

- GET /store/listings/:id

Auth:

- Public Store route with publishable API key.

Behavior:

- Returns the listing only if it is active.
- Non-active listings return 404.

Success response:

- listing: StoreListing

Not found response:

- message: Listing not found

---

## 3. Add marketplace listing to cart

Endpoint:

- POST /store/carts/:id/listings

Auth:

- Guest cart supported.
- Authenticated customer cart supported.
- Customer-bound carts require the authenticated customer owner.
- Requires publishable API key.

Request body:

- listing_id: string
- quantity: number
- metadata?: object

Behavior:

- Adds an active marketplace listing to the cart as a line item.
- The backend injects marketplace listing metadata into the cart line item.

Required line item metadata:

- marketplace_listing_id
- listing_id
- print_id
- seller_id
- source, when provided by frontend

Expected errors:

- 404: Listing not found
- 400: Listing is not connected to a product variant
- 400: Requested quantity exceeds listing availability

---

## 4. List shipping options for cart

Endpoint:

- GET /store/shipping-options

Auth:

- Guest cart supported.
- Customer-bound carts require the authenticated customer owner.
- Requires publishable API key.

Query params:

- cart_id: string
- is_return?: boolean

Success response:

- shipping_options: StoreShippingOption[]

---

## 5. Add shipping method to cart

Endpoint:

- POST /store/carts/:id/shipping-methods

Request body:

- option_id: string
- data?: object

Success response:

- cart: StoreCart

---

## 6. Create payment collection

Endpoint:

- POST /store/payment-collections

Request body:

- cart_id: string

Success response:

- payment_collection.id: string

Ownership behavior:

- Guest cart payment collection is allowed.
- Customer-bound cart payment collection requires the authenticated owner.
- Foreign customer and unauthenticated access to customer-bound carts is blocked.

---

## 7. Create payment session

Endpoint:

- POST /store/payment-collections/:id/payment-sessions

Request body:

- provider_id: string
- data?: object

Current test provider:

- provider_id: pp_system_default
- data: {}

Success response:

- payment_collection.id: string

Ownership behavior:

- Payment session creation validates the payment collection linked cart.
- Customer-bound carts require the authenticated owner.

---

## 8. Complete cart

Endpoint:

- POST /store/carts/:id/complete

Request body:

- Empty object.

Current marketplace success response:

- order_set.id: string
- order_set.orders: StoreOrder[]

Minimum StoreOrder fields expected by frontend:

- id
- currency_code
- items

Important:

- The current completed order response does not guarantee nested order.seller.
- Frontend must not depend on order.seller until backend explicitly adds it to the contract.

---

## 9. Buyer order set

Endpoint:

- GET /store/order-set/:id

Auth:

- Customer authenticated.

Behavior:

- Only the owner customer can retrieve the order set.

Success response:

- order_set.id: string
- order_set.orders: StoreOrder[]

---

## 10. Buyer order detail

Endpoint:

- GET /store/orders/:id

Auth:

- Customer authenticated.

Behavior:

- Only the owner customer can retrieve the order.

Success response:

- order: StoreOrder

---

## MVP frontend dependency list

The first storefront frontend can be built with these API calls:

1. GET /store/listings
2. GET /store/listings/:id
3. POST /store/carts/:id/listings
4. GET /store/shipping-options?cart_id=<cart_id>
5. POST /store/carts/:id/shipping-methods
6. POST /store/payment-collections
7. POST /store/payment-collections/:id/payment-sessions
8. POST /store/carts/:id/complete
9. GET /store/order-set/:id
10. GET /store/orders/:id

---

## Known gaps before production

Not blockers for the current backend contract test, but required before public beta:

- Real payment provider instead of pp_system_default.
- Clear totals contract for cart and order responses.
- Seller hydration in completed order response, or separate seller/order enrichment.
- Storefront-friendly image contract.
- Storefront-friendly card/print enrichment.
- Public seller profile contract.
- Shipping price and delivery timing contract.
- Error code normalization for frontend UX.

---

## Validation source

Validated by:

- integration-tests/http/storefront-purchase-flow-contract.spec.ts

Latest known validation:

- Storefront purchase flow contract: PASS
- Store cart listing add: PASS
- Store cart listing complete: PASS
- Store payment collections ownership: PASS
- Store shipping options cart ownership: PASS
- Store order query: PASS
