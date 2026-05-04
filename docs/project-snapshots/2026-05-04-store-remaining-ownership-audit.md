# Project Snapshot — Store Remaining Ownership Audit

Date: 2026-05-04

## Current state

A final ownership audit was performed after the Store API ownership hardening PRs were merged.

Latest relevant commits on `main`:

- `fix(store): guard bound cart customer ownership`
- `fix(store): guard shipping options cart ownership`
- `fix(store): guard payment collection ownership`
- `fix(store): guard standard cart ownership`
- `fix(store): guard order detail ownership`

This snapshot documents the remaining Store API surface after the audit.

## Audit result

No additional code change is required at this point.

The remaining Store API routes were reviewed and classified as either:

- already protected by customer authentication and ownership checks,
- intentionally public,
- or intentionally token-based.

## Store API coverage

### Cart routes

Covered by customer-bound cart ownership guards.

Relevant areas:

- `GET /store/carts/:id`
- `POST /store/carts/:id`
- `POST /store/carts/:id/customer`
- `POST /store/carts/:id/line-items`
- `POST /store/carts/:id/line-items/:line_id`
- `DELETE /store/carts/:id/line-items/:line_id`
- `POST /store/carts/:id/listings`
- `POST /store/carts/:id/shipping-methods`
- `DELETE /store/carts/:id/shipping-methods`
- `POST /store/carts/:id/promotions`
- `DELETE /store/carts/:id/promotions`
- `POST /store/carts/:id/taxes`
- `POST /store/carts/:id/complete`

Behavior:

- Guest carts remain compatible.
- Customer-bound carts require the authenticated customer owner.
- Foreign customer and unauthenticated access to bound carts is blocked.

### Shipping options

Covered.

Relevant routes:

- `GET /store/shipping-options`
- `GET /store/shipping-options/return`

Behavior:

- Regular shipping options validate `cart_id` ownership when a customer-bound cart is used.
- Return shipping options validate `order_id` ownership.

### Payment collections

Covered.

Relevant routes:

- `POST /store/payment-collections`
- `POST /store/payment-collections/:id/payment-sessions`

Behavior:

- Payment collection creation validates the requested `cart_id`.
- Payment session creation validates the payment collection’s linked cart.
- Guest cart compatibility is preserved.
- Customer-bound carts require the authenticated owner.

### Returns

Covered.

Relevant routes:

- `GET /store/returns`
- `GET /store/returns/:id`
- `POST /store/returns`

Behavior:

- Return list and detail routes are customer-authenticated.
- Return creation validates that the submitted `order_id` belongs to the authenticated customer.

### Order sets

Covered.

Relevant routes:

- `GET /store/order-set`
- `GET /store/order-set/:id`

Behavior:

- List route scopes to authenticated customer.
- Detail route validates ownership by resource id.

### Orders

Covered for customer-owned access.

Relevant routes:

- `GET /store/orders`
- `GET /store/orders/:id`
- `POST /store/orders/:id/transfer/request`
- `POST /store/orders/:id/transfer/cancel`

Behavior:

- Core list route scopes orders by authenticated customer.
- Detail route now requires authentication and validates ownership.
- Transfer request/cancel now require ownership of the order.

Routes intentionally left token-based:

- `POST /store/orders/:id/transfer/accept`
- `POST /store/orders/:id/transfer/decline`

Reason:

- These flows are designed around transfer tokens.
- Adding customer ownership auth here without redesigning the transfer flow could break legitimate token-based order transfers.

### Wishlist

Reviewed and considered covered.

Relevant routes:

- `GET /store/wishlist`
- `POST /store/wishlist`
- `DELETE /store/wishlist/:id/product/:reference_id`

Behavior:

- Wishlist routes require customer authentication.
- Wishlist creation stores `customer_id` from `req.auth_context.actor_id`.
- Wishlist listing filters by authenticated customer.
- Wishlist deletion validates ownership through the customer-wishlist link.

### Customers

Reviewed and considered covered by Medusa core.

Relevant routes:

- `POST /store/customers`
- `GET /store/customers/me`
- `POST /store/customers/me`
- `GET /store/customers/me/addresses`
- `POST /store/customers/me/addresses`
- `GET /store/customers/me/addresses/:address_id`
- `POST /store/customers/me/addresses/:address_id`
- `DELETE /store/customers/me/addresses/:address_id`

Behavior:

- `/store/customers/me*` routes require customer authentication.
- Customer and address operations use the authenticated actor id.
- Address detail/update/delete validates address ownership.

### Listings

Reviewed and intentionally public.

Relevant routes:

- `GET /store/listings`
- `GET /store/listings/:id`

Reason:

- Storefront listing discovery should be public.
- Routes only expose active listings.

### Sellers

Reviewed and intentionally public.

Relevant routes:

- `GET /store/seller`
- `GET /store/seller/:handle`

Reason:

- Storefront seller discovery/profile pages should be public.

## Validation already completed in this ownership hardening phase

The following suites were run individually during the related PRs due to WSL terminal/process instability:

- `integration-tests/http/store-cart-customer-ownership.spec.ts`
- `integration-tests/http/store-cart-listing-add.spec.ts`
- `integration-tests/http/store-cart-listing-complete.spec.ts`
- `integration-tests/http/store-cart-listing-stock-step.spec.ts`
- `integration-tests/http/store-shipping-options-cart-ownership.spec.ts`
- `integration-tests/http/store-payment-collections-ownership.spec.ts`
- `integration-tests/http/store-return-create.spec.ts`
- `integration-tests/http/store-return-shipping-options.spec.ts`
- `integration-tests/http/store-returns-query.spec.ts`
- `integration-tests/http/store-order-query.spec.ts`
- `integration-tests/http/store-order-set-query.spec.ts`
- `integration-tests/http/store-wishlist-query.spec.ts`

## Conclusion

The Store API ownership audit is complete.

No additional Store ownership guard is recommended right now.

Next recommended phase:

- move from ownership/security hardening into MVP product readiness:
  - customer storefront flow,
  - seller listing lifecycle,
  - checkout/order UX,
  - marketplace operational states,
  - and frontend/API contract cleanup.
