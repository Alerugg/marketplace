import Link from "next/link"
import { notFound } from "next/navigation"

import AddToCartForm from "../../../components/AddToCartForm"
import Header from "../../../components/Header"
import {
  fetchStoreListing,
  formatCondition,
  formatMoney,
  listingImage,
  listingSubtitle,
  listingTitle
} from "../../../lib/api"

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

      <div className="detail-back-row">
        <Link className="text-link" href="/">← Back to listings</Link>
      </div>

      <div className="detail-grid">
        <div className="detail-image">
          {image ? <img src={image} alt={listingTitle(listing)} /> : <span>No image</span>}
        </div>

        <section className="detail-card">
          <div className="card-eyebrow">{listingSubtitle(listing)}</div>
          <h2 className="detail-title">{listingTitle(listing)}</h2>

          <div className="card-meta">
            {catalog.game_name || catalog.game_slug ? (
              <span className="badge badge-strong">{catalog.game_name || catalog.game_slug}</span>
            ) : null}
            {catalog.set_code ? <span className="badge">{catalog.set_code}</span> : null}
            {catalog.collector_number ? <span className="badge">#{catalog.collector_number}</span> : null}
            {catalog.rarity ? <span className="badge">{catalog.rarity}</span> : null}
            {listing.condition_code ? <span className="badge">{formatCondition(listing.condition_code)}</span> : null}
          </div>

          <div className="purchase-panel">
            <div>
              <span className="muted">Current price</span>
              <strong>{formatMoney(listing.price_amount, listing.currency_code)}</strong>
            </div>
            <AddToCartForm listing={listing} />
          </div>

          <div className="detail-list">
            <div className="detail-row">
              <span>Available quantity</span>
              <strong>{listing.quantity_available || 0}</strong>
            </div>
            <div className="detail-row">
              <span>Condition</span>
              <strong>{formatCondition(listing.condition_code) || "Not specified"}</strong>
            </div>
            <div className="detail-row">
              <span>Location</span>
              <strong>{listing.location_country || "Not specified"}</strong>
            </div>
            <div className="detail-row">
              <span>Set</span>
              <strong>{catalog.set_name || catalog.set_code || "Catalog pending"}</strong>
            </div>
            <div className="detail-row">
              <span>Print ID</span>
              <strong>{listing.print_id}</strong>
            </div>
          </div>

          {listing.seller_note ? (
            <div className="seller-note">
              <span>Seller note</span>
              <p>{listing.seller_note}</p>
            </div>
          ) : null}

          {!listing.catalog ? (
            <div className="catalog-warning">
              Catalog metadata is not available for this listing yet. Listing fields are still safe to display.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
