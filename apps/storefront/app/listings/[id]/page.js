import Link from "next/link"
import { notFound } from "next/navigation"

import Header from "../../../components/Header"
import { fetchStoreListing, formatMoney, listingImage, listingTitle } from "../../../lib/api"

export default async function ListingDetailPage({ params }) {
  const payload = await fetchStoreListing(params.id)

  if (!payload?.listing) {
    notFound()
  }

  const listing = payload.listing
  const catalog = listing.catalog || {}
  const image = listingImage(listing)

  return (
    <main className="page-shell">
      <Header />

      <div className="detail-grid">
        <div className="detail-image">
          {image ? <img src={image} alt={listingTitle(listing)} /> : <span>No image</span>}
        </div>

        <section className="detail-card">
          <div className="card-eyebrow">{catalog.game_name || catalog.game_slug || "TCG listing"}</div>
          <h2 className="detail-title">{listingTitle(listing)}</h2>

          <div className="card-meta">
            {catalog.set_code ? <span className="badge">{catalog.set_code}</span> : null}
            {catalog.collector_number ? <span className="badge">#{catalog.collector_number}</span> : null}
            {catalog.rarity ? <span className="badge">{catalog.rarity}</span> : null}
            {listing.condition_code ? <span className="badge">{listing.condition_code}</span> : null}
          </div>

          <div className="detail-list">
            <div className="detail-row">
              <span>Price</span>
              <strong>{formatMoney(listing.price_amount, listing.currency_code)}</strong>
            </div>
            <div className="detail-row">
              <span>Available quantity</span>
              <strong>{listing.quantity_available}</strong>
            </div>
            <div className="detail-row">
              <span>Condition</span>
              <strong>{listing.condition_code || "Not specified"}</strong>
            </div>
            <div className="detail-row">
              <span>Location</span>
              <strong>{listing.location_country || "Not specified"}</strong>
            </div>
            <div className="detail-row">
              <span>Print ID</span>
              <strong>{listing.print_id}</strong>
            </div>
          </div>

          {listing.seller_note ? <p className="muted">{listing.seller_note}</p> : null}

          <Link className="cta" href="/">Back to listings</Link>
        </section>
      </div>
    </main>
  )
}
