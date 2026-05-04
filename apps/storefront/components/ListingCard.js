import Link from "next/link"

import { formatMoney, listingImage, listingTitle } from "../lib/api"

export default function ListingCard({ listing }) {
  const catalog = listing.catalog || {}
  const image = listingImage(listing)

  return (
    <Link href={`/listings/${listing.id}`} className="listing-card">
      <div className="card-image">
        {image ? <img src={image} alt={listingTitle(listing)} /> : <span>No image</span>}
      </div>

      <div className="card-body">
        <div className="card-eyebrow">{catalog.game_name || catalog.game_slug || "TCG"}</div>

        <h3 className="card-title">{listingTitle(listing)}</h3>

        <div className="card-meta">
          {catalog.set_code ? <span className="badge">{catalog.set_code}</span> : null}
          {catalog.collector_number ? <span className="badge">#{catalog.collector_number}</span> : null}
          {catalog.rarity ? <span className="badge">{catalog.rarity}</span> : null}
          {listing.condition_code ? <span className="badge">{listing.condition_code}</span> : null}
        </div>

        <div className="price-row">
          <span className="price">{formatMoney(listing.price_amount, listing.currency_code)}</span>
          <span className="muted">Qty {listing.quantity_available}</span>
        </div>
      </div>
    </Link>
  )
}
