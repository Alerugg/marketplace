import { createPaymentSessionsWorkflow } from '@medusajs/core-flows'
import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString
} from '@medusajs/framework/utils'
import { refetchPaymentCollection } from '@medusajs/medusa/api/store/payment-collections/helpers'

type StoreCreatePaymentSessionBody = {
  provider_id: string
  data?: Record<string, unknown>
}

const assertPaymentCollectionCartOwnershipIfBound = async (
  req: AuthenticatedMedusaRequest<StoreCreatePaymentSessionBody>,
  res: MedusaResponse,
  paymentCollectionId: string
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [cartPaymentCollection] = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: 'cart_payment_collection',
      variables: {
        filters: {
          payment_collection_id: paymentCollectionId
        }
      },
      fields: ['cart_id']
    })
  )

  const cartId = cartPaymentCollection?.cart_id

  if (!cartId) {
    res.status(404).json({
      message: `Payment collection with id: ${paymentCollectionId} not found`,
      type: MedusaError.Types.NOT_FOUND
    })
    return false
  }

  const {
    data: [cart]
  } = await query.graph({
    entity: 'cart',
    fields: ['id', 'customer_id'],
    filters: {
      id: cartId
    }
  })

  if (!cart) {
    res.status(404).json({
      message: `Cart with id: ${cartId} not found`,
      type: MedusaError.Types.NOT_FOUND
    })
    return false
  }

  if (
    cart.customer_id &&
    cart.customer_id !== req.auth_context?.actor_id
  ) {
    res.status(404).json({
      message: `Payment collection with id: ${paymentCollectionId} not found`,
      type: MedusaError.Types.NOT_FOUND
    })
    return false
  }

  return true
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreatePaymentSessionBody>,
  res: MedusaResponse
) => {
  const paymentCollectionId = req.params.id
  const { provider_id, data } = req.validatedBody

  const allowed = await assertPaymentCollectionCartOwnershipIfBound(
    req,
    res,
    paymentCollectionId
  )

  if (!allowed) {
    return
  }

  await createPaymentSessionsWorkflow(req.scope).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id,
      customer_id: req.auth_context?.actor_id,
      data
    }
  })

  const paymentCollection = await refetchPaymentCollection(
    paymentCollectionId,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    payment_collection: paymentCollection
  })
}
