import { MiddlewareRoute, authenticate } from "@medusajs/framework";

import { storeCartsMiddlewares } from "./carts/middlewares";
import { storeListingsMiddlewares } from "./listings/middlewares";
import { storeOrderSetMiddlewares } from "./order-set/middlewares";
import { storeOrderMiddlewares } from "./orders/middlewares";
import { storePaymentCollectionsMiddlewares } from "./payment-collections/middlewares";
import { storeReturnsMiddlewares } from "./returns/middlewares";
import { storeSellerMiddlewares } from "./seller/middlewares";
import { storeShippingOptionRoutesMiddlewares } from "./shipping-options/middlewares";
import { storeWishlistMiddlewares } from "./wishlist/middlewares";

export const storeMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/reviews/*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/return-request/*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  ...storeCartsMiddlewares,
  ...storeListingsMiddlewares,
  ...storeOrderSetMiddlewares,
  ...storeOrderMiddlewares,
  ...storePaymentCollectionsMiddlewares,
  ...storeSellerMiddlewares,
  ...storeShippingOptionRoutesMiddlewares,
  ...storeReturnsMiddlewares,
  ...storeWishlistMiddlewares,
];
