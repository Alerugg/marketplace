"use client"

import { useEffect, useMemo, useState } from "react"

import {
  addShippingMethodToCart,
  fetchShippingOptions,
  formatMoney,
  updateStoreCart
} from "../lib/api"
import { readAuthToken } from "../lib/auth-storage"

const fallbackAddress = {
  firstName: "Demo",
  lastName: "Buyer",
  address1: "Calle Demo 1",
  city: "Madrid",
  countryCode: "es",
  postalCode: "28001",
  phone: "+34910000000"
}

const addressFromCart = (cart) => {
  const address = cart?.shipping_address || {}

  return {
    firstName: address.first_name || fallbackAddress.firstName,
    lastName: address.last_name || fallbackAddress.lastName,
    address1: address.address_1 || fallbackAddress.address1,
    city: address.city || fallbackAddress.city,
    countryCode: address.country_code || fallbackAddress.countryCode,
    postalCode: address.postal_code || fallbackAddress.postalCode,
    phone: address.phone || fallbackAddress.phone
  }
}

const toMedusaAddress = (address) => ({
  first_name: address.firstName,
  last_name: address.lastName,
  address_1: address.address1,
  city: address.city,
  country_code: String(address.countryCode || "es").toLowerCase(),
  postal_code: address.postalCode,
  phone: address.phone
})

const optionAmount = (option) => {
  return Number(
    option?.amount ??
      option?.calculated_price?.calculated_amount ??
      option?.prices?.[0]?.amount ??
      0
  )
}

const optionCurrency = (option, fallbackCurrency) => {
  return (
    option?.calculated_price?.currency_code ||
    option?.prices?.[0]?.currency_code ||
    fallbackCurrency ||
    "eur"
  )
}

export default function ShippingStep({ cart, cartId, onCartUpdated }) {
  const [address, setAddress] = useState(() => addressFromCart(cart))
  const [options, setOptions] = useState([])
  const [selectedOptionId, setSelectedOptionId] = useState("")
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")

  const token = readAuthToken()
  const items = cart?.items || []
  const selectedShippingMethod = cart?.shipping_methods?.[0] || null
  const currencyCode = cart?.currency_code || "eur"
  const isBusy = status === "saving" || status === "loading"

  const addressReady = useMemo(() => {
    return Boolean(
      address.firstName &&
        address.lastName &&
        address.address1 &&
        address.city &&
        address.countryCode &&
        address.postalCode
    )
  }, [address])

  useEffect(() => {
    setAddress(addressFromCart(cart))
  }, [cart?.shipping_address?.id])

  const handleAddressChange = (field, value) => {
    setAddress((current) => ({
      ...current,
      [field]: value
    }))
  }

  const requireShippingPreconditions = () => {
    if (!token) {
      setStatus("error")
      setMessage("Sign in before selecting shipping.")
      return false
    }

    if (!cartId || !items.length) {
      setStatus("error")
      setMessage("Add at least one listing before selecting shipping.")
      return false
    }

    if (!addressReady) {
      setStatus("error")
      setMessage("Complete the shipping address first.")
      return false
    }

    return true
  }

  const loadShippingOptions = async () => {
    if (!requireShippingPreconditions()) {
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const payload = await fetchShippingOptions({ cartId, token })
      const nextOptions = payload?.shipping_options || []

      setOptions(nextOptions)
      setSelectedOptionId(nextOptions[0]?.id || "")
      setStatus("ready")
      setMessage(
        nextOptions.length
          ? "Shipping options loaded."
          : "No shipping options are available for this cart yet."
      )
    } catch (error) {
      setStatus("error")
      setMessage(error?.message || "Could not load shipping options.")
    }
  }

  const saveAddressAndLoadOptions = async () => {
    if (!requireShippingPreconditions()) {
      return
    }

    setStatus("saving")
    setMessage("")

    try {
      const medusaAddress = toMedusaAddress(address)

      const payload = await updateStoreCart({
        cartId,
        token,
        data: {
          email: cart?.email || cart?.customer?.email,
          shipping_address: medusaAddress,
          billing_address: medusaAddress
        }
      })

      const nextCart = payload?.cart || cart
      await onCartUpdated(nextCart)

      const shippingPayload = await fetchShippingOptions({ cartId, token })
      const nextOptions = shippingPayload?.shipping_options || []

      setOptions(nextOptions)
      setSelectedOptionId(nextOptions[0]?.id || "")
      setStatus("ready")
      setMessage(
        nextOptions.length
          ? "Shipping options loaded."
          : "No shipping options are available for this cart yet."
      )
    } catch (error) {
      setStatus("error")
      setMessage(error?.message || "Could not save shipping address.")
    }
  }

  const selectShippingMethod = async () => {
    if (!requireShippingPreconditions()) {
      return
    }

    if (!selectedOptionId) {
      setStatus("error")
      setMessage("Select a shipping option first.")
      return
    }

    setStatus("saving")
    setMessage("")

    try {
      const payload = await addShippingMethodToCart({
        cartId,
        optionId: selectedOptionId,
        token
      })

      await onCartUpdated(payload?.cart || cart)

      setStatus("saved")
      setMessage("Shipping method added to cart.")
    } catch (error) {
      setStatus("error")
      setMessage(error?.message || "Could not add shipping method.")
    }
  }

  return (
    <section className="shipping-step">
      <div className="shipping-heading">
        <div>
          <span className="card-eyebrow">Shipping</span>
          <h3>Delivery details</h3>
        </div>

        {selectedShippingMethod ? (
          <span className="shipping-selected-pill">Shipping selected</span>
        ) : null}
      </div>

      {!token ? (
        <p className="cart-message cart-message-warning">
          Sign in before selecting shipping. Customer-bound carts require an authenticated buyer token.
        </p>
      ) : null}

      {!items.length ? (
        <p className="cart-message cart-message-warning">
          Add at least one marketplace listing before selecting shipping.
        </p>
      ) : null}

      <div className="shipping-address-grid">
        <label className="shipping-field">
          First name
          <input
            value={address.firstName}
            onChange={(event) => handleAddressChange("firstName", event.target.value)}
          />
        </label>

        <label className="shipping-field">
          Last name
          <input
            value={address.lastName}
            onChange={(event) => handleAddressChange("lastName", event.target.value)}
          />
        </label>

        <label className="shipping-field shipping-field-wide">
          Address
          <input
            value={address.address1}
            onChange={(event) => handleAddressChange("address1", event.target.value)}
          />
        </label>

        <label className="shipping-field">
          City
          <input
            value={address.city}
            onChange={(event) => handleAddressChange("city", event.target.value)}
          />
        </label>

        <label className="shipping-field">
          Country code
          <input
            value={address.countryCode}
            onChange={(event) => handleAddressChange("countryCode", event.target.value)}
          />
        </label>

        <label className="shipping-field">
          Postal code
          <input
            value={address.postalCode}
            onChange={(event) => handleAddressChange("postalCode", event.target.value)}
          />
        </label>

        <label className="shipping-field">
          Phone
          <input
            value={address.phone}
            onChange={(event) => handleAddressChange("phone", event.target.value)}
          />
        </label>
      </div>

      <div className="shipping-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={!token || !items.length || isBusy}
          onClick={saveAddressAndLoadOptions}
        >
          {status === "saving" ? "Saving..." : "Save address and load shipping"}
        </button>

        <button
          type="button"
          className="secondary-button"
          disabled={!token || !items.length || status === "loading"}
          onClick={loadShippingOptions}
        >
          {status === "loading" ? "Loading..." : "Refresh shipping options"}
        </button>
      </div>

      {options.length ? (
        <div className="shipping-options">
          {options.map((option) => (
            <label className="shipping-option" key={option.id}>
              <input
                type="radio"
                name="shipping-option"
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => setSelectedOptionId(option.id)}
              />

              <span>
                <strong>{option.name || "Shipping option"}</strong>
                <small>
                  {option.seller_name ? `${option.seller_name} · ` : ""}
                  {formatMoney(optionAmount(option), optionCurrency(option, currencyCode))}
                </small>
              </span>
            </label>
          ))}

          <button
            type="button"
            className="secondary-button"
            disabled={!selectedOptionId || isBusy}
            onClick={selectShippingMethod}
          >
            {status === "saving" ? "Applying shipping..." : "Use selected shipping"}
          </button>
        </div>
      ) : null}

      {selectedShippingMethod ? (
        <p className="cart-message cart-message-success">
          Selected shipping: {formatMoney(selectedShippingMethod.amount || 0, currencyCode)}
        </p>
      ) : null}

      {message ? (
        <p className={`cart-message ${status === "error" ? "cart-message-error" : "cart-message-success"}`}>
          {message}
        </p>
      ) : null}
    </section>
  )
}
