import AuthForm from "../../../components/AuthForm"
import Header from "../../../components/Header"

export default function LoginPage() {
  return (
    <main className="page-shell">
      <Header />

      <section className="account-page">
        <AuthForm mode="login" />
      </section>
    </main>
  )
}
