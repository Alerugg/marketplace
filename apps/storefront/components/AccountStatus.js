"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { clearAuthSession, readAuthEmail, readAuthToken } from "../lib/auth-storage"

export default function AccountStatus() {
  const [email, setEmail] = useState("")
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const sync = () => {
      const token = readAuthToken()
      setHasToken(Boolean(token))
      setEmail(readAuthEmail())
    }

    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("dontripit-auth-changed", sync)

    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("dontripit-auth-changed", sync)
    }
  }, [])

  if (!hasToken) {
    return (
      <Link className="nav-pill" href="/account/login">
        Sign in
      </Link>
    )
  }

  return (
    <div className="account-nav">
      <Link className="nav-pill" href="/account">
        {email || "Account"}
      </Link>
      <button
        className="nav-pill nav-pill-button"
        type="button"
        onClick={() => clearAuthSession()}
      >
        Sign out
      </button>
    </div>
  )
}
