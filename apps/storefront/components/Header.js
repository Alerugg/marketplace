import Link from "next/link"

export default function Header() {
  return (
    <header className="header">
      <Link href="/" className="brand">
        <span className="brand-mark">Dontripit</span>
        <h1 className="brand-title">TCG marketplace</h1>
      </Link>

      <span className="nav-pill">MVP Storefront</span>
    </header>
  )
}
