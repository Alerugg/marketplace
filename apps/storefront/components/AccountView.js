"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { fetchCurrentCustomer } from "../lib/api"
import { clearAuthSession, readAuthEmail, readAuthToken } from "../lib/auth-storage"

export default function AccountView() {
  const [customer, setCustomer] = useState(null)
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const load = async () => {
      const token = readAuthToken()

      if (!token) {
        setStatus("anonymous")
        return
      }

      try {
        const payload = await fetchCurrentCustomer(token)
        setCustomer(payload?.customer || null)
        setStatus("ready")
      } catch (error) {
        setStatus("error")
        setMessage(error?.message || "Could not load account.")
      }
    }

    load()
  }, [])

  if (status === "loading") {
    return <div className="auth-card">Loading account...</div>
  }

  if (status === "anonymous") {
    return (
      <div className="auth-card">
        <div className="hero-kicker">Account</div>
        <h2>You are not signed in</h2>
        <p className="muted">Sign in to link your cart and continue checkout.</p>
        <Link className="auth-submit auth-link-button" href="/account/login">
          Sign in
        </Link>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="auth-card">
        <div className="hero-kicker">Account</div>
        <h2>Session needs refresh</h2>
        <p className="cart-message cart-message-error">{message}</p>
        <button
          className="auth-submit"
          type="button"
          onClick={() => {
            clearAuthSession()
            window.location.href = "/account/login"
          }}
        >
          Sign in again
        </button>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="hero-kicker">Account</div>
      <h2>{customer?.first_name || "Dontripit"} buyer profile</h2>

      <div className="detail-list">
        <div className="detail-row">
          <span>Email</span>
          <strong>{customer?.email || readAuthEmail()}</strong>
        </div>
        <div className="detail-row">
          <span>Customer ID</span>
          <strong>{customer?.id || "Not available"}</strong>
        </div>
        <div className="detail-row">
          <span>Account</span>
          <strong>{customer?.has_account ? "Active" : "Pending"}</strong>
        </div>
      </div>

      <Link className="auth-submit auth-link-button" href="/cart">
        Back to cart
      </Link>
    </div>
  )
}
