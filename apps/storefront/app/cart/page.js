import CartView from "../../components/CartView"
import Header from "../../components/Header"

export default function CartPage() {
  return (
    <main className="page-shell">
      <Header />

      <section className="cart-hero">
        <span className="hero-kicker">Buyer flow</span>
        <h2>Cart</h2>
        <p>
          Review the marketplace listings stored in your local storefront cart before the checkout and shipping phases.
        </p>
      </section>

      <CartView />
    </main>
  )
}
