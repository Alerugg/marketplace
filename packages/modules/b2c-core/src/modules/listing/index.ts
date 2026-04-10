import { Module } from '@medusajs/framework/utils'

import ListingModuleService from './service'

export const LISTING_MODULE = 'listing'
export { ListingModuleService }

export default Module(LISTING_MODULE, {
  service: ListingModuleService
})
