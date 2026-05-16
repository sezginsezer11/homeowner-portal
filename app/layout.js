import './globals.css'

export const metadata = {
  title: 'HomeOwner Portal',
  description: 'Your complete home intelligence platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
