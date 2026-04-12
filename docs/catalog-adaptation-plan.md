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




## PROJECT SNAPSHOT — 2026-04-12 (listing backend runtime validation)

### Estado actual verificado

- `yarn build` funciona correctamente en el monorepo.
- `apps/backend/yarn db:migrate` funciona correctamente.
- La migración del módulo `listing` corre correctamente en runtime:
  - `MODULE: listing`
  - `Migration20260410110000`
- El smoke test HTTP base ya está alineado con una ruta real del backend y pasa:
  - `apps/backend/integration-tests/http/health.spec.ts`
- Se añadió cobertura de integración para vendor listings:
  - `apps/backend/integration-tests/http/vendor-listings.spec.ts`
- La cobertura validada en runtime incluye:
  - create listing sin `seller_id` en request body
  - rechazo de `status` inválido
  - rechazo de `seller_id` en create body
  - listado de listings del seller autenticado
  - retrieve de listing propio
  - patch de listing propio con campos permitidos
  - rechazo de `seller_id` en patch body
  - rechazo de acceso a listing de otro seller cuando aplica el seller scoping

### Qué quedó realmente probado

- El contrato endurecido del listing seller API está funcionando en tests de integración reales.
- `seller_id` se inyecta server-side.
- `seller_id` no es aceptado en create/update schema.
- `status` está restringido a los valores permitidos.
- La migración del dominio `listing` no está solo “presente”; también se ejecuta correctamente durante bootstrap de integración.

### Qué sigue pendiente

- No se ha iniciado Phase 2.
- No se ha tocado storefront.
- No se ha añadido integración remota de catálogo.
- No se han tocado payments ni product flows fuera del alcance del listing backend.

### Bloqueadores actuales

- Ningún bloqueador crítico para cerrar esta fase de listing backend.
- Persisten warnings no bloqueantes en tests/dev:
  - `Local Event Bus installed`
  - subscribers de Algolia no funcionales
  - `Force exiting Jest`
- Esos warnings no impidieron validar esta fase.

### Siguiente paso recomendado

Cerrar y mergear esta rama de tests/backend validation a `main`, y luego pasar a la siguiente fase estrictamente backend del listing domain, sin tocar storefront ni catálogo remoto todavía.
