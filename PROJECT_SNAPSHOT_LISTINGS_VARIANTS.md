# Marketplace Snapshot — Listings bound to product variants

## Estado actual

Se añadió soporte para que una listing pueda quedar asociada a un `product_variant_id`.

## Cambios principales

- El modelo `listing` ahora soporta `product_variant_id` nullable.
- Se añadió migración para crear la columna e índice:
  - `packages/modules/b2c-core/src/modules/listing/migrations/Migration20260502003000.ts`
- La creación de listings valida:
  - Variante existente.
  - Variante perteneciente al seller autenticado.
- El carrito al añadir una listing usa `product_variant_id` como `variant_id`.
- Se impide crear una listing con una variante de otro seller.
- Se impide crear una listing con una variante inexistente.
- Se impide actualizar `product_variant_id` en una listing existente.

## Resultado esperado validado

- Variante propia: `201`
- Variante inexistente: `400`
- Variante de otro seller: `403`
- Añadir listing al carrito sin `product_variant_id`: rechazo controlado.
- Añadir listing al carrito con `product_variant_id`: crea line item con `variant_id`.

## Tests ejecutados en verde

- `yarn workspace @mercurjs/b2c-core build`
- `yarn lint`
- `yarn jest integration-tests/http/vendor-listing-create.spec.ts --runInBand`
- `yarn jest integration-tests/http/store-cart-listing-add.spec.ts --runInBand`
- `yarn jest integration-tests/http/vendor-listing-actions.spec.ts --runInBand`
- `yarn jest integration-tests/http/vendor-listing-update.spec.ts --runInBand`

## Nota técnica

Medusa mapea `MedusaError.Types.NOT_ALLOWED` a `400`, no a `403`.
Por eso el caso específico de variante perteneciente a otro seller se captura en la ruta `POST /vendor/listings` y se responde manualmente con `403`.
