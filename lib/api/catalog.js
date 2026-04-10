const DEFAULT_BASE_URL = 'http://localhost:3000/api/catalog'

/**
 * Base helper for external catalog API calls.
 */
async function requestCatalog(path, params = {}) {
  const baseUrl = process.env.CATALOG_API_BASE_URL || DEFAULT_BASE_URL
  const url = new URL(`${baseUrl}${path}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Catalog API request failed (${response.status}): ${text}`)
  }

  return response.json()
}

/**
 * Search cards in external catalog.
 */
export async function searchCatalog(query, options = {}) {
  return requestCatalog('/search', {
    q: query,
    ...options,
  })
}

/**
 * Fetch catalog sets list.
 */
export async function fetchSets(options = {}) {
  return requestCatalog('/sets', options)
}

/**
 * Fetch card details from external catalog.
 */
export async function fetchCard(cardId, options = {}) {
  return requestCatalog('/cards', {
    id: cardId,
    ...options,
  })
}

export default {
  searchCatalog,
  fetchSets,
  fetchCard,
}
