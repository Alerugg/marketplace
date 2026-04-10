export const vendorListingFields = [
  'id',
  'print_id',
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

export const vendorListingsQueryConfig = {
  list: {
    defaults: vendorListingFields,
    isList: true
  },
  retrieve: {
    defaults: vendorListingFields,
    isList: false
  }
}
