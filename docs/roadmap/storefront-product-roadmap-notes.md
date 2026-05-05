# Storefront Product Roadmap Notes

Date: 2026-05-05

## 1. Visual redesign requirement

The current storefront UI is acceptable as a functional MVP foundation, but it is not the desired final visual direction.

The current template should be considered temporary.

Product direction:

- avoid generic AI-looking UI
- avoid overused dark SaaS templates
- create a more ownable Dontripit visual identity
- align catalog and marketplace visually
- improve typography, spacing, color system, card layouts, listing pages, catalog pages, and marketplace flows
- make the product feel credible for real collectors, sellers, and TCG buyers

Decision:

The complete visual redesign should not block core MVP functionality.

Priority order:

1. get browsing/listings working
2. get cart working
3. get checkout/order flow working
4. get seller listing flow stable
5. then redesign the storefront/catalog experience with a stronger product identity

Future suggested branch:

- `feat/storefront-visual-redesign-system`

## 2. Unified Dontripit account requirement

Catalog and marketplace must eventually share the same user account and login session.

Target experience:

- user signs in once
- user can move between catalog and marketplace without logging in again
- user can browse catalog, wishlist cards, manage collection, buy cards, sell cards, and view orders from one Dontripit identity
- catalog and marketplace should feel like one product, even if they remain technically separate apps/services

Recommended architecture direction:

Create a shared Dontripit identity layer.

Conceptual model:

- Dontripit User
  - Catalog profile
  - Marketplace customer profile
  - Marketplace seller/vendor profile
  - Wishlist
  - Collection
  - Alerts
  - Orders
  - Preferences

Important technical rule:

Upcoming work should avoid decisions that make unified identity harder later.

Avoid:

- duplicated user accounts with no linking strategy
- independent login systems with no migration path
- marketplace-only customer assumptions
- catalog-only anonymous assumptions
- coupling buyer identity directly to one app instead of a shared Dontripit identity

Recommended implementation timing:

Do not implement unified identity before the basic buyer MVP flow is stable.

Suggested order:

1. complete storefront listing browsing
2. complete add-to-cart
3. complete cart page
4. complete shipping method selection
5. complete checkout/payment test flow
6. complete order success page
7. then start unified identity foundation

Future suggested branch:

- `feat/unified-identity-foundation`

## 3. Next immediate product priority

The next immediate priority is not visual redesign or unified identity.

The next immediate priority is making local storefront testing useful with real demo data.

Recommended next branch:

- `chore/storefront-demo-data-seed`

Goal:

Create repeatable demo marketplace listings so the storefront can display cards and the buyer add-to-cart flow can be tested manually.
