import "./globals.css"

export const metadata = {
  title: "Dontripit Storefront",
  description: "TCG marketplace storefront for Dontripit"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
