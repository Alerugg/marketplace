"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { fetchCurrentCustomer } from "../lib/api"
import { readAuthToken } from "../lib/auth-storage"

export default function AuthPageGuard({ children }) {
  const [status, setStatus] = useState("checking")
  const [customer, setCustomer] = useState(null)

  useEffect(() => {
    const token = readAuthToken()

    if (!token) {
      setStatus("guest")
      return
    }

    fetchCurrentCustomer(token)
      .then((payload) => {
        setCustomer(payload?.customer || null)
        setStatus("signed-in")
      })
      .catch(() => {
        setStatus("guest")
      })
  }, [])

  if (status === "checking") {
    return (
      <section className="auth-card">
        <span className="card-eyebrow">Account</span>
        <h2>Checking session...</h2>
        <p className="muted">Validating your buyer session.</p>
      </section>
    )
  }

  if (status === "signed-in") {
    return (
      <section className="auth-card">
        <span className="card-eyebrow">Already signed in</span>
        <h2>You are already logged in</h2>
        <p className="muted">
          Signed in as {customer?.email || "your Dontripit buyer account"}.
        </p>

        <div className="auth-actions-row">
          <Link className="cta" href="/account">
            Go to account
          </Link>

          <Link className="secondary-link-button" href="/cart">
            Back to cart
          </Link>
        </div>
      </section>
    )
  }

  return children
}
