import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

type ProductVariantRow = {
  id: string
  product_id: string | null
}

export const assertProductVariantBelongsToSeller = async (
  container: MedusaContainer,
  sellerId: string,
  productVariantId?: string | null
) => {
  if (!productVariantId) {
    return
  }

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const productVariant = await knex<ProductVariantRow>('product_variant')
    .select('id', 'product_id')
    .where({
      id: productVariantId
    })
    .whereNull('deleted_at')
    .first()

  if (!productVariant?.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'product_variant_id does not reference an existing product variant'
    )
  }

  const sellerProduct = await knex('seller_seller_product_product')
    .select('seller_id')
    .where({
      seller_id: sellerId,
      product_id: productVariant.product_id
    })
    .whereNull('deleted_at')
    .first()

  if (!sellerProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'product_variant_id does not belong to the authenticated seller'
    )
  }
}
