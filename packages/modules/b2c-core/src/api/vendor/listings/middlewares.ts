import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import {
  checkResourceOwnershipByResourceId,
  filterBySellerId,
} from "../../../shared/infra/http/middlewares";
import { vendorListingsQueryConfig } from "./query-config";
import {
  VendorCreateListing,
  VendorGetListingsParams,
  VendorUpdateListing,
} from "./validators";

export const vendorListingsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/listings",
    middlewares: [
      validateAndTransformBody(VendorCreateListing),
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/listings",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.list,
      ),
      filterBySellerId(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/listings/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
  {
    method: ["PATCH"],
    matcher: "/vendor/listings/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateListing),
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/listings/:id/activate",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/listings/:id/pause",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/listings/:id/archive",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/listings/:id/sell",
    middlewares: [
      validateAndTransformQuery(
        VendorGetListingsParams,
        vendorListingsQueryConfig.retrieve,
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: "listing",
      }),
    ],
  },
];
