export const storeListingFields = [
  'id',
  'print_id',
  'product_variant_id',
  'seller_id',
  'price_amount',
  'currency_code',
  'condition_code',
  'quantity_available',
  'status',
  'seller_note',
  'photos',
  'location_country',
  'shipping_profile_id',
  'created_at',
  'updated_at'
]

export const storeListingsQueryConfig = {
  list: {
    defaults: storeListingFields,
    isList: true
  },
  retrieve: {
    defaults: storeListingFields,
    isList: false
  }
}
