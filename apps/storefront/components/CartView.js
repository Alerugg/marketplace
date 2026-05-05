"use client"

import Link from "next/link"

import { readAuthToken } from "../lib/auth-storage"
import { useEffect, useMemo, useState } from "react"

import {
  fetchStoreCart,
  fetchStoreListing,
  formatCondition,
  formatMoney,
  listingImage,
  listingTitle
} from "../lib/api"

const CART_STORAGE_KEY = "dontripit_storefront_cart_id"

const cartItemListingId = (item) => {
  return item?.metadata?.marketplace_listing_id || item?.metadata?.listing_id || ""
}

const fallbackLineItemImage = (item) => {
  return item?.thumbnail || item?.metadata?.image_url || item?.metadata?.photo || null
}

const fallbackLineItemTitle = (item) => {
  return (
    item?.metadata?.print_id ||
    item?.title ||
    item?.product_title ||
    item?.variant_title ||
    item?.metadata?.listing_id ||
    "Marketplace listing"
  )
}

const marketplaceLineAmount = (item, listing) => {
  const quantity = Number(item?.quantity || 1)

  if (listing?.price_amount !== undefined && listing?.price_amount !== null) {
    return Number(listing.price_amount || 0) * quantity
  }

  const explicitTotal = item?.total ?? item?.subtotal ?? item?.amount_total

  if (explicitTotal !== undefined && explicitTotal !== null) {
    return Number(explicitTotal || 0)
  }

  return Number(item?.unit_price || 0) * quantity
}

export default function CartView() {
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [cartId, setCartId] = useState("")
  const [cart, setCart] = useState(null)
  const [listingsById, setListingsById] = useState({})
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")

  const items = cart?.items || []
  const currencyCode = cart?.currency_code || items?.[0]?.currency_code || "eur"

  const cartTotal = useMemo(() => {
    if (!items.length) {
      return 0
    }

    return items.reduce((sum, item) => {
      const listingId = cartItemListingId(item)
      const listing = listingsById[listingId]
      return sum + marketplaceLineAmount(item, listing)
    }, 0)
  }, [items, listingsById])

  const hydrateMarketplaceListings = async (cartItems) => {
    const listingIds = [
      ...new Set(cartItems.map((item) => cartItemListingId(item)).filter(Boolean))
    ]

    if (!listingIds.length) {
      setListingsById({})
      return
    }

    const pairs = await Promise.all(
      listingIds.map(async (listingId) => {
        try {
          const payload = await fetchStoreListing(listingId)
          return [listingId, payload?.listing || null]
        } catch {
          return [listingId, null]
        }
      })
    )

    setListingsById(
      Object.fromEntries(pairs.filter(([, listing]) => Boolean(listing)))
    )
  }

  const loadCart = async (storedCartId) => {
    setStatus("loading")
    setError("")

    try {
      const payload = await fetchStoreCart(storedCartId)
      const nextCart = payload?.cart || null

      if (!nextCart) {
        setCart(null)
        setListingsById({})
        setStatus("empty")
        return
      }

      setCart(nextCart)
      await hydrateMarketplaceListings(nextCart.items || [])
      setStatus("ready")
    } catch (loadError) {
      setError(loadError?.message || "Could not load cart.")
      setStatus("error")
    }
  }

  useEffect(() => {
    const syncAuth = () => setHasAuthToken(Boolean(readAuthToken()))

    syncAuth()
    window.addEventListener("storage", syncAuth)
    window.addEventListener("dontripit-auth-changed", syncAuth)

    return () => {
      window.removeEventListener("storage", syncAuth)
      window.removeEventListener("dontripit-auth-changed", syncAuth)
    }
  }, [])

  useEffect(() => {
    const storedCartId = window.localStorage.getItem(CART_STORAGE_KEY) || ""

    if (!storedCartId) {
      setStatus("empty")
      return
    }

    setCartId(storedCartId)
    loadCart(storedCartId)
  }, [])

  const clearLocalCart = () => {
    window.localStorage.removeItem(CART_STORAGE_KEY)
    setCartId("")
    setCart(null)
    setListingsById({})
    setStatus("empty")
    setError("")
  }

  if (status === "loading") {
    return (
      <section className="cart-layout">
        <div className="cart-panel">
          <p className="muted">Loading cart...</p>
        </div>
      </section>
    )
  }

  if (status === "empty") {
    return (
      <section className="cart-layout">
        <div className="cart-panel cart-empty">
          <span className="card-eyebrow">Cart</span>
          <h2>Your cart is empty</h2>
          <p className="muted">
            Add a marketplace listing from a card detail page to start the buyer flow.
          </p>
          <Link className="cta" href="/">
            Browse listings
          </Link>
        </div>
      </section>
    )
  }

  if (status === "error") {
    return (
      <section className="cart-layout">
        <div className="cart-panel cart-empty">
          <span className="card-eyebrow">Cart error</span>
          <h2>Could not load your cart</h2>
          <p className="cart-message cart-message-error">{error}</p>
          <div className="cart-actions">
            {!hasAuthToken ? (
            <div className="cart-auth-notice">
              <strong>Sign in required before checkout</strong>
              <span>Your cart is saved locally. Sign in to link it to your buyer account.</span>
              <Link className="text-link" href="/account/login">Sign in or create account</Link>
            </div>
          ) : null}

          <button type="button" className="secondary-button" onClick={() => cartId && loadCart(cartId)}>
              Try again
            </button>
            <button type="button" className="secondary-button" onClick={clearLocalCart}>
              Clear local cart
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-layout">
      <div className="cart-panel">
        <div className="cart-page-heading">
          <div>
            <span className="card-eyebrow">Cart</span>
            <h2>Your selected listings</h2>
          </div>
          <span className="muted">{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-inline">
            <p className="muted">This cart has no items yet.</p>
            <Link className="cta" href="/">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="cart-items-list">
            {items.map((item) => {
              const listingId = cartItemListingId(item)
              const listing = listingsById[listingId]
              const image = listing ? listingImage(listing) : fallbackLineItemImage(item)
              const title = listing ? listingTitle(listing) : fallbackLineItemTitle(item)
              const condition = listing?.condition_code || item?.metadata?.condition_code
              const amount = marketplaceLineAmount(item, listing)

              return (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    {image ? <img src={image} alt={title} /> : <span>No image</span>}
                  </div>

                  <div className="cart-item-body">
                    <h3>{title}</h3>

                    {item?.title && listing ? (
                      <p className="cart-product-note">
                        Checkout variant: {item.title}
                      </p>
                    ) : null}

                    <div className="cart-item-meta">
                      {listingId ? <span className="badge">Listing {listingId}</span> : null}
                      {listing?.print_id || item?.metadata?.print_id ? (
                        <span className="badge">{listing?.print_id || item.metadata.print_id}</span>
                      ) : null}
                      {condition ? <span className="badge">{formatCondition(condition)}</span> : null}
                      {listing?.seller_id || item?.metadata?.seller_id ? (
                        <span className="badge">Seller {listing?.seller_id || item.metadata.seller_id}</span>
                      ) : null}
                    </div>

                    <div className="cart-item-actions">
                      <span className="muted">Qty {item.quantity || 1}</span>
                      <strong>{formatMoney(amount, listing?.currency_code || currencyCode)}</strong>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <aside className="cart-summary">
        <span className="card-eyebrow">Order summary</span>

        <div className="summary-row">
          <span>Cart ID</span>
          <strong>{cartId ? `${cartId.slice(0, 12)}...` : "Not set"}</strong>
        </div>

        <div className="summary-row">
          <span>Items</span>
          <strong>{items.length}</strong>
        </div>

        <div className="summary-row summary-total">
          <span>Marketplace total</span>
          <strong>{formatMoney(cartTotal, currencyCode)}</strong>
        </div>

        <p className="cart-summary-note">
          Checkout is still disabled. Next phase must align backend cart pricing with marketplace listing pricing before payment is enabled.
        </p>

        <button type="button" disabled>
          {hasAuthToken ? "Checkout coming next" : "Sign in to continue checkout"}
        </button>

        <Link className="cart-link" href="/">
          Continue shopping
        </Link>

        <button type="button" className="secondary-button" onClick={clearLocalCart}>
          Clear local cart
        </button>
      </aside>
    </section>
  )
}
