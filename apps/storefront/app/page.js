import EmptyState from "../components/EmptyState"
import FilterBar from "../components/FilterBar"
import Header from "../components/Header"
import ListingCard from "../components/ListingCard"
import { fetchStoreListings, filterAndSortListings } from "../lib/api"

export default async function HomePage({ searchParams }) {
  let payload = null
  let error = null

  try {
    payload = await fetchStoreListings()
  } catch (err) {
    error = err
  }

  const listings = payload?.listings || []
  const visibleListings = filterAndSortListings(listings, searchParams)

  const catalogReadyCount = listings.filter((listing) => listing.catalog).length
  const filtersActive = Boolean(
    searchParams?.q || searchParams?.game || searchParams?.condition || searchParams?.sort
  )

  return (
    <main className="page-shell">
      <Header />

      <section className="hero">
        <div className="hero-card hero-main">
          <div className="hero-kicker">Buyer marketplace MVP</div>
          <h2>Find the right TCG card without digging through messy listings.</h2>
          <p>
            Browse active seller listings connected to normalized catalog metadata: card name, game, set,
            collector number, rarity, image, condition, price, and availability.
          </p>

          <div className="hero-actions">
            <a className="cta" href="#latest-listings">Browse listings</a>
            <span className="muted">Powered by the Marketplace Store API</span>
          </div>
        </div>

        <aside className="stats-panel hero-card">
          <div className="stat">
            <strong>{listings.length}</strong>
            <span>Active listings loaded</span>
          </div>
          <div className="stat">
            <strong>{catalogReadyCount}</strong>
            <span>Listings with catalog metadata</span>
          </div>
          <div className="stat">
            <strong>{visibleListings.length}</strong>
            <span>Visible after filters</span>
          </div>
        </aside>
      </section>

      <section id="latest-listings">
        <div className="toolbar">
          <div>
            <h2>Latest listings</h2>
            <p className="section-subtitle">
              Search and filter locally without changing the backend contract.
            </p>
          </div>
          <span className="muted">{visibleListings.length} results</span>
        </div>

        <FilterBar filters={searchParams} />

        {error ? (
          <div className="error-box">
            <strong>Could not load listings.</strong>
            <span>Check NEXT_PUBLIC_MEDUSA_BACKEND_URL and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY.</span>
          </div>
        ) : null}

        {!error && listings.length === 0 ? (
          <EmptyState
            title="No active listings yet"
            description="Once sellers publish active listings, they will appear here automatically."
          />
        ) : null}

        {!error && listings.length > 0 && visibleListings.length === 0 ? (
          <EmptyState
            title="No listings match these filters"
            description={filtersActive ? "Try resetting the filters or searching a broader card name." : "No results found."}
          />
        ) : null}

        <div className="grid">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  )
}
