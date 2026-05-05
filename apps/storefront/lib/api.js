const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const storeHeaders = () => {
  const headers = {
    "Content-Type": "application/json"
  }

  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }

  return headers
}

export const formatMoney = (amount, currencyCode) => {
  const numericAmount = Number(amount || 0)
  const currency = String(currencyCode || "eur").toUpperCase()

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(numericAmount)
}

export const formatCondition = (conditionCode) => {
  return String(conditionCode || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const listingTitle = (listing) => {
  return listing?.catalog?.card_name || listing?.print_id || "Unknown card"
}

export const listingSubtitle = (listing) => {
  const catalog = listing?.catalog || {}
  const parts = [
    catalog.game_name || catalog.game_slug,
    catalog.set_code,
    catalog.collector_number ? `#${catalog.collector_number}` : null
  ].filter(Boolean)

  return parts.length ? parts.join(" · ") : "Catalog pending"
}

export const listingImage = (listing) => {
  return (
    listing?.photos?.[0] ||
    listing?.catalog?.primary_image_url ||
    listing?.catalog?.image_url ||
    null
  )
}

export const normalizeFilterValue = (value) => {
  return String(value || "").trim().toLowerCase()
}

export const filterAndSortListings = (listings, filters = {}) => {
  const q = normalizeFilterValue(filters.q)
  const game = normalizeFilterValue(filters.game)
  const condition = normalizeFilterValue(filters.condition)
  const sort = normalizeFilterValue(filters.sort || "newest")

  const filtered = listings.filter((listing) => {
    const catalog = listing.catalog || {}

    const haystack = [
      catalog.card_name,
      catalog.game,
      catalog.game_slug,
      catalog.game_name,
      catalog.set_code,
      catalog.set_name,
      catalog.collector_number,
      catalog.rarity,
      listing.print_id,
      listing.condition_code,
      listing.seller_note
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const listingGame = normalizeFilterValue(catalog.game_slug || catalog.game || catalog.game_name)
    const listingCondition = normalizeFilterValue(listing.condition_code)

    if (q && !haystack.includes(q)) {
      return false
    }

    if (game && listingGame !== game) {
      return false
    }

    if (condition && listingCondition !== condition) {
      return false
    }

    return true
  })

  return filtered.sort((a, b) => {
    if (sort === "price_asc") {
      return Number(a.price_amount || 0) - Number(b.price_amount || 0)
    }

    if (sort === "price_desc") {
      return Number(b.price_amount || 0) - Number(a.price_amount || 0)
    }

    if (sort === "quantity_desc") {
      return Number(b.quantity_available || 0) - Number(a.quantity_available || 0)
    }

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })
}

export const fetchStoreListings = async () => {
  const response = await fetch(`${backendUrl}/store/listings?limit=48`, {
    headers: storeHeaders(),
    cache: "no-store"
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.status}`)
  }

  return response.json()
}

export const fetchStoreListing = async (id) => {
  const response = await fetch(`${backendUrl}/store/listings/${id}`, {
    headers: storeHeaders(),
    cache: "no-store"
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }

    throw new Error(`Failed to fetch listing: ${response.status}`)
  }

  return response.json()
}

export const storefrontRegionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || ""

export const createStoreCart = async () => {
  if (!storefrontRegionId) {
    throw new Error("Missing NEXT_PUBLIC_MEDUSA_REGION_ID")
  }

  const response = await fetch(`${backendUrl}/store/carts`, {
    method: "POST",
    headers: storeHeaders(),
    body: JSON.stringify({
      region_id: storefrontRegionId,
      metadata: {
        source: "dontripit-storefront"
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create cart: ${response.status}`)
  }

  return response.json()
}

export const addListingToCart = async ({ cartId, listingId, quantity }) => {
  const response = await fetch(`${backendUrl}/store/carts/${cartId}/listings`, {
    method: "POST",
    headers: storeHeaders(),
    body: JSON.stringify({
      listing_id: listingId,
      quantity,
      metadata: {
        source: "dontripit-storefront"
      }
    })
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    const error = new Error(message || `Failed to add listing to cart: ${response.status}`)
    error.status = response.status
    throw error
  }

  return response.json()
}

export const fetchStoreCart = async (cartId) => {
  if (!cartId) {
    throw new Error("Missing cart id")
  }

  const response = await fetch(`${backendUrl}/store/carts/${cartId}`, {
    headers: storeHeaders(),
    cache: "no-store"
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }

    throw new Error(`Failed to fetch cart: ${response.status}`)
  }

  return response.json()
}

export const authRegisterCustomer = async ({ email, password }) => {
  const response = await fetch(`${backendUrl}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to register customer: ${response.status}`)
  }

  return response.json()
}

export const authLoginCustomer = async ({ email, password }) => {
  const response = await fetch(`${backendUrl}/auth/customer/emailpass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to login customer: ${response.status}`)
  }

  return response.json()
}

export const createStoreCustomer = async ({ token, email, firstName, lastName }) => {
  const response = await fetch(`${backendUrl}/store/customers`, {
    method: "POST",
    headers: {
      ...storeHeaders(),
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName
    })
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to create customer profile: ${response.status}`)
  }

  return response.json()
}

export const fetchCurrentCustomer = async (token) => {
  const response = await fetch(`${backendUrl}/store/customers/me`, {
    headers: {
      ...storeHeaders(),
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to fetch current customer: ${response.status}`)
  }

  return response.json()
}

export const attachCustomerToCart = async ({ cartId, token }) => {
  const response = await fetch(`${backendUrl}/store/carts/${cartId}/customer`, {
    method: "POST",
    headers: {
      ...storeHeaders(),
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to attach customer to cart: ${response.status}`)
  }

  return response.json()
}

