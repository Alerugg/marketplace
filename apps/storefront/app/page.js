import Header from "../components/Header"
import ListingCard from "../components/ListingCard"
import { fetchStoreListings } from "../lib/api"

export default async function HomePage() {
  let payload = null
  let error = null

  try {
    payload = await fetchStoreListings()
  } catch (err) {
    error = err
  }

  const listings = payload?.listings || []

  return (
    <main className="page-shell">
      <Header />

      <section className="hero">
        <div className="hero-card">
          <h2>Buy and sell TCG cards with cleaner market data.</h2>
          <p>
            Dontripit connects seller listings with normalized catalog metadata so buyers can browse by card, set,
            collector number, rarity, condition, price, and availability.
          </p>
        </div>

        <aside className="stats-panel hero-card">
          <div className="stat">
            <strong>{listings.length}</strong>
            <span>Active listings loaded</span>
          </div>
          <div className="stat">
            <strong>Catalog</strong>
            <span>Nullable enrichment ready</span>
          </div>
          <div className="stat">
            <strong>MVP</strong>
            <span>Storefront foundation</span>
          </div>
        </aside>
      </section>

      <section>
        <div className="toolbar">
          <h2>Latest listings</h2>
          <span className="muted">Public Store API</span>
        </div>

        {error ? (
          <div className="error-box">
            Could not load listings. Check NEXT_PUBLIC_MEDUSA_BACKEND_URL and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY.
          </div>
        ) : null}

        {!error && listings.length === 0 ? (
          <div className="error-box">No active listings found yet.</div>
        ) : null}

        <div className="grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  )
}
