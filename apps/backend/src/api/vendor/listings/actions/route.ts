import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

type BulkListingAction = "activate" | "pause" | "archive" | "sell"

type BulkActionBody = {
  listing_ids?: string[]
  action?: string
}

const ALLOWED_ACTIONS: BulkListingAction[] = [
  "activate",
  "pause",
  "archive",
  "sell",
]

const buildBaseUrl = (req: AuthenticatedMedusaRequest) => {
  const forwardedProto = req.headers["x-forwarded-proto"]
  const protocol =
    (Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto?.split(",")[0]) ||
    req.protocol ||
    "http"

  const host = req.headers.host || "127.0.0.1:9000"

  return `${protocol}://${host}`
}

const readJsonSafely = async (response: Response) => {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as BulkActionBody
  const { listing_ids, action } = body

  if (!Array.isArray(listing_ids) || listing_ids.length === 0) {
    return res.status(400).json({
      message: "listing_ids must be a non-empty array",
    })
  }

  const hasInvalidListingId = listing_ids.some(
    (listingId) => typeof listingId !== "string" || !listingId.trim()
  )

  if (hasInvalidListingId) {
    return res.status(400).json({
      message: "listing_ids must contain only non-empty strings",
    })
  }

  if (
    typeof action !== "string" ||
    !ALLOWED_ACTIONS.includes(action as BulkListingAction)
  ) {
    return res.status(400).json({
      message: `action must be one of: ${ALLOWED_ACTIONS.join(", ")}`,
    })
  }

  const authorization = req.headers.authorization

  if (!authorization) {
    return res.status(401).json({
      message: "Unauthorized",
    })
  }

  const baseUrl = buildBaseUrl(req)
  const listings: any[] = []

  for (const listingId of listing_ids) {
    const response = await fetch(
      `${baseUrl}/vendor/listings/${encodeURIComponent(listingId)}/${action}`,
      {
        method: "POST",
        headers: {
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }
    )

    const payload = await readJsonSafely(response)

    if (!response.ok) {
      return res.status(response.status).json(
        payload && typeof payload === "object"
          ? payload
          : {
              message: `Bulk action failed for listing ${listingId}`,
            }
      )
    }

    if (!payload || typeof payload !== "object" || !("listing" in payload)) {
      return res.status(500).json({
        message: `Bulk action response missing listing payload for ${listingId}`,
      })
    }

    listings.push((payload as any).listing)
  }

  return res.status(200).json({
    count: listings.length,
    listings,
  })
}