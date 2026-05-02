
## 2026-05-02 — Listing stock decrement workflow tests

Branch:
- feat/listing-product-variant-binding

Latest commits:
- 290be57 Test listing stock decrement workflow
- 3998d4b Add listings variant snapshot
- dc112e9 Validate listing product variant ownership
- 30b2366 feat(carts): decrement listing stock on checkout
- 88f7f24 feat(carts): add listing add-to-cart endpoint

What changed:
- Added integration coverage for marketplace listing stock decrement workflow.
- Covered stock decrement when a listing is purchased through cart line items.
- Covered marking a listing as sold when stock reaches zero.
- Covered aggregation of multiple cart line items pointing to the same listing.
- Covered rejection when cart line item variant does not match listing product variant.
- Covered rejection when requested quantity exceeds listing availability.
- Test helper supports Medusa workflow errors whether they reject directly or are returned in workflow error payloads.

Validation:
- yarn workspace @mercurjs/b2c-core build
- yarn jest integration-tests/http/store-cart-listing-add.spec.ts --runInBand
- yarn jest integration-tests/http/store-cart-listing-stock-step.spec.ts --runInBand

Result:
- Store Cart Listing Add API: 4 passed
- Store Cart Listing Stock Step: 5 passed
- Working tree clean after commit 290be57
