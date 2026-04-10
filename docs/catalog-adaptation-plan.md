# Marketplace fork (Mercur) — análisis y plan de adaptación

## Fase 0 — inspección controlada

## Arquitectura actual (repositorio presente)

El fork actual contiene principalmente **backend y módulos de dominio** de Mercur/Medusa:

- `apps/backend`: servidor principal Medusa, configuración, scripts seed y tests HTTP básicos.
- `packages/framework`: tipos, utilidades y middlewares compartidos para entidades marketplace.
- `packages/modules/*`: módulos de negocio (b2c-core, commission, reviews, payments, etc.).

No hay storefront B2C completo dentro de este repo (el propio README referencia un repo aparte para storefront), por lo que en este código no existen actualmente páginas de explorer/card-grid del frontend final.

## Componentes/partes reutilizables

1. **Contrato de marketplace y tipos**
   - Tipos y contratos en `packages/framework/src/types/*` (seller, marketplace, reviews, etc.).
2. **Patrones de módulos y estructura por dominio**
   - Organización por `api`, `modules`, `workflows`, `subscribers` en `packages/modules/b2c-core`.
3. **Infra y tooling existente**
   - Turbo workspaces, lint/build scripts, estructura de paquetes ya probada.

## Partes acopladas al backend propio (a evitar para catálogo externo)

1. Lógica de catálogo/producto dependiente de Medusa/Mercur en backend y seeds.
2. Reglas internas de configuración del catálogo global (`global_product_catalog`, etc.).
3. Flujo de ingestión/sincronización pensado para entidades internas de Mercur.

## Qué no sirve para este caso (o debe quedar fuera del alcance ahora)

1. Integraciones de pago y payout (Stripe connect, payouts).
2. Flujos de vendor onboarding / comisiones / fulfilment específicos de Mercur.
3. Cualquier duplicación de catálogo local si la fuente de verdad será `API-PROJECT`.

---

## Fases 1–4 (adaptación incremental, sin rewrite)

### Fase 1 — adaptación (no rewrite)
- Reusar UI/estructura existente cuando esté disponible.
- Cambiar el origen de datos del catálogo al cliente externo.

### Fase 2 — integración API
- Añadir cliente `lib/api/catalog.js` con:
  - `searchCatalog`
  - `fetchSets`
  - `fetchCard`

### Fase 3 — UI adaptation
- En este repo no están presentes componentes de explorer/card-grid del storefront.
- Cuando se incorporen (o en el repo de storefront), conectar esas vistas al cliente de `lib/api/catalog.js`.

### Fase 4 — lógica marketplace
- Mantener UI de listings cuando exista.
- Usar `mock` simple para listings iniciales (sin pagos ni backend propio).

