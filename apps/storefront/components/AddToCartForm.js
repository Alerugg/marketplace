"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { addListingToCart, createStoreCart, storefrontRegionId } from "../lib/api"
import { CART_STORAGE_KEY, readAuthToken } from "../lib/auth-storage"

export default function AddToCartForm({ listing }) {
  const maxQuantity = Number(listing?.quantity_available || 0)
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")
  const [cartId, setCartId] = useState("")

  const canPurchase = useMemo(() => {
    return Boolean(
      listing?.id &&
        listing?.status === "active" &&
        listing?.product_variant_id &&
        maxQuantity > 0 &&
        storefrontRegionId
    )
  }, [listing, maxQuantity])

  const disabledReason = useMemo(() => {
    if (!storefrontRegionId) {
      return "Cart is not configured yet. Add NEXT_PUBLIC_MEDUSA_REGION_ID to the storefront env."
    }

    if (!listing?.product_variant_id) {
      return "This listing is not connected to a purchasable product variant yet."
    }

    if (listing?.status !== "active") {
      return "This listing is not active."
    }

    if (maxQuantity <= 0) {
      return "This listing is out of stock."
    }

    return ""
  }, [listing, maxQuantity])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canPurchase) {
      setStatus("error")
      setMessage(disabledReason || "This listing cannot be purchased yet.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      let currentCartId = cartId || window.localStorage.getItem(CART_STORAGE_KEY) || ""

      if (!currentCartId) {
        const created = await createStoreCart()
        currentCartId = created?.cart?.id

        if (!currentCartId) {
          throw new Error("Cart was created but no cart id was returned.")
        }

        window.localStorage.setItem(CART_STORAGE_KEY, currentCartId)
        setCartId(currentCartId)
      }

      const payload = await addListingToCart({
        cartId: currentCartId,
        listingId: listing.id,
        quantity: Number(quantity),
        token: readAuthToken()
      })

      setStatus("success")
      setMessage(payload?.cart?.id ? "Added to cart." : "Added to cart.")
    } catch (error) {
      if (error?.status === 404) {
        try {
          window.localStorage.removeItem(CART_STORAGE_KEY)

          const created = await createStoreCart()
          const newCartId = created?.cart?.id

          if (!newCartId) {
            throw new Error("Cart was created but no cart id was returned.")
          }

          window.localStorage.setItem(CART_STORAGE_KEY, newCartId)
          setCartId(newCartId)

          const payload = await addListingToCart({
            cartId: newCartId,
            listingId: listing.id,
            quantity: Number(quantity)
          })

          setStatus("success")
          setMessage(payload?.cart?.id ? "Added to a fresh cart." : "Added to cart.")
          return
        } catch (retryError) {
          setStatus("error")
          setMessage(retryError?.message || "Could not recover your cart. Please try again.")
          return
        }
      }

      setStatus("error")
      setMessage(error?.message || "Could not add this listing to cart.")
    }
  }

  return (
    <form className="add-to-cart-panel" onSubmit={handleSubmit}>
      <div className="quantity-field">
        <label htmlFor="quantity">Quantity</label>
        <select
          id="quantity"
          name="quantity"
          value={quantity}
          disabled={!canPurchase || status === "loading"}
          onChange={(event) => setQuantity(event.target.value)}
        >
          {Array.from({ length: Math.max(maxQuantity, 1) }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={!canPurchase || status === "loading"}>
        {status === "loading" ? "Adding..." : "Add to cart"}
      </button>

      {!canPurchase ? <p className="cart-message cart-message-warning">{disabledReason}</p> : null}

      {message ? (
        <p className={`cart-message ${status === "error" ? "cart-message-error" : "cart-message-success"}`}>
          {message}
        </p>
      ) : null}

      {status === "success" ? (
        <Link className="cart-link" href="/cart">
          View cart
        </Link>
      ) : null}
    </form>
  )
}
