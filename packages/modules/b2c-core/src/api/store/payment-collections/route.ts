import { createPaymentCollectionForCartWorkflowId } from '@medusajs/core-flows'
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString
} from '@medusajs/framework/utils'

type StoreCreatePaymentCollectionBody = {
  cart_id: string
}

const refetchPaymentCollectionForCart = async (
  cartId: string,
  req: MedusaRequest<StoreCreatePaymentCollectionBody>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const [cartCollectionRelation] = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: 'cart_payment_collection',
      variables: {
        filters: {
          cart_id: cartId
        }
      },
      fields: req.queryConfig.fields.map((field) => `payment_collection.${field}`)
    })
  )

  return cartCollectionRelation?.payment_collection
}

export const POST = async (
  req: MedusaRequest<StoreCreatePaymentCollectionBody>,
  res: MedusaResponse
) => {
  const { cart_id } = req.validatedBody

  let paymentCollection = await refetchPaymentCollectionForCart(cart_id, req)

  if (!paymentCollection) {
    const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)

    await workflowEngine.run(createPaymentCollectionForCartWorkflowId, {
      input: req.validatedBody,
      transactionId: `create-payment-collection-for-cart-${cart_id}`
    })

    paymentCollection = await refetchPaymentCollectionForCart(cart_id, req)
  }

  res.status(200).json({
    payment_collection: paymentCollection
  })
}
