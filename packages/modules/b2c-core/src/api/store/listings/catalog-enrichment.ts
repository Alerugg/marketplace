type StoreListing = Record<string, any>

type CatalogPrintResolveItem = {
  query?: string
  found?: boolean
  print_id?: string
  catalog?: Record<string, any> | null
}

type CatalogPrintResolveResponse = {
  prints?: CatalogPrintResolveItem[]
}

const CATALOG_PRINT_RESOLVE_PATH = '/api/prints/resolve'

const catalogConfig = () => {
  const baseUrl = process.env.CATALOG_API_URL?.trim()
  const apiKey = process.env.CATALOG_API_KEY?.trim()

  if (!baseUrl || !apiKey) {
    return null
  }

  return {
    baseUrl,
    apiKey
  }
}

const catalogResolveUrl = (baseUrl: string) => {
  return new URL(CATALOG_PRINT_RESOLVE_PATH, baseUrl).toString()
}

const withoutCatalog = (listings: StoreListing[]) => {
  return listings.map((listing) => ({
    ...listing,
    catalog: null
  }))
}

const resolveCatalogPrints = async (
  printIds: string[]
): Promise<Map<string, Record<string, any>>> => {
  const config = catalogConfig()

  if (!config || printIds.length === 0) {
    return new Map()
  }

  const response = await fetch(catalogResolveUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
    },
    body: JSON.stringify({
      print_ids: printIds
    })
  })

  if (!response.ok) {
    return new Map()
  }

  const payload = (await response.json()) as CatalogPrintResolveResponse
  const catalogByPrintId = new Map<string, Record<string, any>>()

  for (const item of payload.prints || []) {
    if (!item?.found || !item.catalog) {
      continue
    }

    const query = String(item.query || '').trim()
    const printId = String(item.print_id || item.catalog.print_id || '').trim()

    if (query) {
      catalogByPrintId.set(query, item.catalog)
    }

    if (printId) {
      catalogByPrintId.set(printId, item.catalog)
    }
  }

  return catalogByPrintId
}

export const enrichStoreListingsWithCatalog = async (
  listings: StoreListing[]
): Promise<StoreListing[]> => {
  if (!Array.isArray(listings) || listings.length === 0) {
    return listings
  }

  const printIds = Array.from(
    new Set(
      listings
        .map((listing) => String(listing.print_id || '').trim())
        .filter(Boolean)
    )
  )

  try {
    const catalogByPrintId = await resolveCatalogPrints(printIds)

    return listings.map((listing) => {
      const printId = String(listing.print_id || '').trim()

      return {
        ...listing,
        catalog: catalogByPrintId.get(printId) || null
      }
    })
  } catch {
    return withoutCatalog(listings)
  }
}
