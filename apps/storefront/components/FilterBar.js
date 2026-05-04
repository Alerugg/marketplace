export default function FilterBar({ filters }) {
  const query = filters?.q || ""
  const game = filters?.game || ""
  const condition = filters?.condition || ""
  const sort = filters?.sort || "newest"

  return (
    <form className="filter-panel" action="/">
      <div className="filter-field filter-search">
        <label htmlFor="q">Search</label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Card, set, collector number..."
          defaultValue={query}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="game">Game</label>
        <select id="game" name="game" defaultValue={game}>
          <option value="">All games</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
          <option value="mtg">Magic</option>
          <option value="onepiece">One Piece</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="condition">Condition</label>
        <select id="condition" name="condition" defaultValue={condition}>
          <option value="">All conditions</option>
          <option value="mint">Mint</option>
          <option value="near_mint">Near mint</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="light_played">Light played</option>
          <option value="played">Played</option>
          <option value="poor">Poor</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="sort">Sort</label>
        <select id="sort" name="sort" defaultValue={sort}>
          <option value="newest">Newest</option>
          <option value="price_asc">Lowest price</option>
          <option value="price_desc">Highest price</option>
          <option value="quantity_desc">Most available</option>
        </select>
      </div>

      <div className="filter-actions">
        <button type="submit">Apply filters</button>
        <a href="/">Reset</a>
      </div>
    </form>
  )
}
