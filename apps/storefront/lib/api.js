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

export const listingTitle = (listing) => {
  return listing?.catalog?.card_name || listing?.print_id || "Unknown card"
}

export const listingImage = (listing) => {
  return (
    listing?.catalog?.primary_image_url ||
    listing?.catalog?.image_url ||
    listing?.photos?.[0] ||
    null
  )
}

export const fetchStoreListings = async () => {
  const response = await fetch(`${backendUrl}/store/listings?limit=24`, {
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
