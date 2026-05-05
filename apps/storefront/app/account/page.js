import AccountView from "../../components/AccountView"
import Header from "../../components/Header"

export default function AccountPage() {
  return (
    <main className="page-shell">
      <Header />

      <section className="account-page">
        <AccountView />
      </section>
    </main>
  )
}
