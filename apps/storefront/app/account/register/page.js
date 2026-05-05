import AuthForm from "../../../components/AuthForm"
import Header from "../../../components/Header"

export default function RegisterPage() {
  return (
    <main className="page-shell">
      <Header />

      <section className="account-page">
        <AuthForm mode="register" />
      </section>
    </main>
  )
}
