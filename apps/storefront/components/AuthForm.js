"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  attachCustomerToCart,
  authLoginCustomer,
  authRegisterCustomer,
  createStoreCustomer,
  fetchCurrentCustomer
} from "../lib/api"
import { readCartId, saveAuthSession } from "../lib/auth-storage"

export default function AuthForm({ mode = "login" }) {
  const router = useRouter()
  const isRegister = mode === "register"

  const [firstName, setFirstName] = useState("Demo")
  const [lastName, setLastName] = useState("Buyer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")

  const attachExistingCart = async (token) => {
    const cartId = readCartId()

    if (!cartId) {
      return
    }

    await attachCustomerToCart({ cartId, token })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      let token = ""

      if (isRegister) {
        const registered = await authRegisterCustomer({ email, password })
        const registrationToken = registered?.token

        if (!registrationToken) {
          throw new Error("Registration succeeded but no token was returned.")
        }

        await createStoreCustomer({
          token: registrationToken,
          email,
          firstName,
          lastName
        })

        const loggedIn = await authLoginCustomer({ email, password })
        token = loggedIn?.token
      } else {
        const loggedIn = await authLoginCustomer({ email, password })
        token = loggedIn?.token
      }

      if (!token) {
        throw new Error("Login succeeded but no token was returned.")
      }

      const current = await fetchCurrentCustomer(token)
      const customerEmail = current?.customer?.email || email

      saveAuthSession({
        token,
        email: customerEmail
      })

      await attachExistingCart(token)

      setStatus("success")
      setMessage(isRegister ? "Account created. Cart linked." : "Signed in. Cart linked.")
      router.push("/cart")
    } catch (error) {
      setStatus("error")
      setMessage(error?.message || "Authentication failed.")
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="hero-kicker">{isRegister ? "Create account" : "Welcome back"}</div>

      <h2>{isRegister ? "Create your Dontripit account" : "Sign in to continue"}</h2>

      <p className="muted">
        {isRegister
          ? "Use one account for the marketplace now, and later for the unified catalog experience."
          : "Sign in before checkout so the cart can be linked to your buyer profile."}
      </p>

      {isRegister ? (
        <div className="auth-grid">
          <div className="filter-field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="filter-field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>
        </div>
      ) : null}

      <div className="filter-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="filter-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <button className="auth-submit" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Working..." : isRegister ? "Create account" : "Sign in"}
      </button>

      {message ? (
        <p className={`cart-message ${status === "error" ? "cart-message-error" : "cart-message-success"}`}>
          {message}
        </p>
      ) : null}

      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to Dontripit?"}{" "}
        <Link href={isRegister ? "/account/login" : "/account/register"}>
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  )
}
