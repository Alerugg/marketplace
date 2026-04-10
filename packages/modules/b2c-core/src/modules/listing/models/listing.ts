import { model } from '@medusajs/framework/utils'

export const Listing = model.define('listing', {
  id: model.id({ prefix: 'lst' }).primaryKey(),
  print_id: model.text(),
  seller_id: model.text(),
  price_amount: model.bigNumber(),
  currency_code: model.text(),
  condition_code: model.text(),
  quantity_available: model.number(),
  status: model.text(),
  seller_note: model.text().nullable(),
  photos: model.json().nullable(),
  location_country: model.text().nullable(),
  shipping_profile_id: model.text().nullable()
})
