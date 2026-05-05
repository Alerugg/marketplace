export const AUTH_TOKEN_STORAGE_KEY = "dontripit_storefront_customer_token"
export const AUTH_EMAIL_STORAGE_KEY = "dontripit_storefront_customer_email"
export const CART_STORAGE_KEY = "dontripit_storefront_cart_id"

export const readAuthToken = () => {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ""
}

export const readAuthEmail = () => {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || ""
}

export const saveAuthSession = ({ token, email }) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)

  if (email) {
    window.localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, email)
  }

  window.dispatchEvent(new Event("dontripit-auth-changed"))
}

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY)
  window.dispatchEvent(new Event("dontripit-auth-changed"))
}

export const readCartId = () => {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(CART_STORAGE_KEY) || ""
}
