import { MedusaService } from '@medusajs/framework/utils'

import { Listing } from './models/listing'

class ListingModuleService extends MedusaService({
  Listing
}) {}

export default ListingModuleService
