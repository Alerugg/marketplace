import Link from "next/link"

import AccountStatus from "./AccountStatus"

export default function Header() {
  return (
    <header className="header">
      <Link href="/" className="brand">
        <span className="brand-mark">Dontripit</span>
        <h1 className="brand-title">TCG marketplace</h1>
      </Link>

      <nav className="nav-actions" aria-label="Storefront navigation">
        <Link className="nav-pill" href="/">
          Listings
        </Link>
        <Link className="nav-pill" href="/cart">
          Cart
        </Link>
        <span className="nav-pill nav-pill-muted">MVP Storefront</span>
      </nav>
          <AccountStatus />
    </header>
  )
}
