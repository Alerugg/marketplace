import AuthForm from "../../../components/AuthForm"
import AuthPageGuard from "../../../components/AuthPageGuard"
import Header from "../../../components/Header"

export default function LoginPage() {
  return (
    <main className="page-shell">
      <Header />

      <section className="account-page">
        <AuthPageGuard>
          <AuthForm mode="login" />
        </AuthPageGuard>
      </section>
    </main>
  )
}
