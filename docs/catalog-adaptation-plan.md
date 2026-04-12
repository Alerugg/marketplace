# Marketplace fork (Mercur) — catalog adaptation corrections and backend Phase 1

## Scope correction (this revision)

This plan intentionally corrects the previous direction:

- The marketplace backend is being adapted to a **print-centric listing domain**, not a card-centric mock flow.
- `print_id` is the canonical marketplace reference for listings.
- `print_id` is mandatory for any listing that can be published.
- Marketplace storage is limited to listing/transaction-specific state; it must not persist catalog truth.
- No storefront explorer implementation is assumed in this repository.
- No root-level generic catalog helpers (such as `lib/api/catalog.js`) are part of this phase.

## Current repo grounding

The repository primarily contains Medusa/Mercur backend packages and plugins, with module patterns concentrated in:

- `packages/modules/b2c-core/src/modules/*` for domain models/services/module registration.
- `packages/modules/b2c-core/src/api/*` for admin/store route handlers.
- `packages/modules/b2c-core/src/workflows/*` for orchestration.

For a minimal backend-only foundation with low breakage risk, the right insertion point is a new module under `packages/modules/b2c-core/src/modules`.

## Backend Phase 1 objective

Introduce a minimal `listing` domain foundation without rewriting existing product flows.

### Canonical listing shape (Phase 1)

The listing model is centered on:

- `print_id` (required)
- `seller_id`
- `price_amount`
- `currency_code`
- `condition_code`
- `quantity_available`
- `status`
- `seller_note`
- `photos`
- `location_country`
- `shipping_profile_id`

## Implementation notes for this phase

1. Add a dedicated `listing` module (model + service + module definition) under `b2c-core` module conventions.
2. Add a migration creating a first-party `listing` table with soft-delete index and basic access indexes (`print_id`, `seller_id`, `status`).
3. Do not add storefront code.
4. Do not add card-based mocks.
5. Do not duplicate external catalog metadata in local storage.
6. Do not refactor/replace existing product logic in this phase.

## Out of scope (intentionally unimplemented)

- Full listing CRUD APIs across admin/store surfaces.
- Seller ownership guards/authorization middleware for listing routes.
- Catalog client integration and print enrichment fetching.
- Payment, checkout, payout, and inventory reservation integration for listings.
- Product-to-listing migration/refactor.

## Next phases (high-level)

- **Phase 2:** lightweight application workflows for create/update listing draft and publish gating (`print_id` + required transactional fields).
- **Phase 3:** minimal admin/seller API surface for listing lifecycle.
- **Phase 4:** transactional integration with order/payment components and selective catalog read-through boundaries.

## PROJECT SNAPSHOT — 2026-04-12 (listing backend validation pass)

### Listing backend status (current)

- `listing` domain exists under `packages/modules/b2c-core/src/modules/listing` with model, service, and module registration.
- Listing migration exists at `packages/modules/b2c-core/src/modules/listing/migrations/Migration20260410110000.ts` and defines table + indexes (`print_id`, `seller_id`, `status`, `deleted_at`).
- Seller vendor listing API endpoints exist under:
  - `POST /vendor/listings`
  - `GET /vendor/listings`
  - `GET /vendor/listings/:id`
  - `PATCH /vendor/listings/:id`
- `seller_id` is server-injected on create (`route.ts`) and intentionally omitted from create/update schemas (`validators.ts` with `.strict()`).
- Listing status is constrained to enum values: `draft`, `active`, `reserved`, `sold`, `paused`, `archived`.

### Verified vs assumed

**Verified in code inspection:**
- Backend loads `@mercurjs/b2c-core` plugin in `apps/backend/medusa-config.ts`, so listing module/migrations are discoverable by Medusa plugin loading.
- Listing queryability wiring exists through both `query.graph({ entity: 'listing' })` and `refetchEntity('listing', ...)` in vendor listing routes.
- Ownership and seller scoping middleware is wired for listing list/retrieve/patch (`filterBySellerId`, `checkResourceOwnershipByResourceId`).
- Prior to this pass there was no listing-specific HTTP integration coverage under `apps/backend/integration-tests/http` (only `health.spec.ts`).

**Attempted but not fully runtime-verified in this environment:**
- Full integration execution requires a reachable Postgres test database; current environment failed before bootstrapping integration app DB.

### Remaining blockers before Phase 2 catalog integration

1. Successfully execute the new vendor listings integration tests in an environment with Postgres connectivity.
2. Confirm migration application in a real run (`medusa db:migrate` + table/index checks) rather than static code inspection.
3. Validate end-to-end seller auth setup for vendor route tests in CI (token + member/seller linkage lifecycle).

### Exact next recommended step

Run backend integration tests in CI/local with a running Postgres service and fix only failing wiring (if any) revealed by `integration-tests/http/vendor-listings.spec.ts`. Once green, use that baseline to begin Phase 2 listing workflows (publish gating + print/canonical field rules), still without storefront/catalog remote integration.
