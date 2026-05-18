import './globals.css'

export const metadata = {
  title: '360Everywhere - Your Home Intelligence Platform',
  description: 'Track your home value, equity, mortgage rates, and connect with agents and lenders.',
  manifest: '/manifest.json',
  themeColor: '#1877F2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '360Everywhere',
  },
  openGraph: {
    title: '360Everywhere - Your Home Intelligence Platform',
    description: 'Track your home value, equity, and mortgage in real time.',
    type: 'website',
    url: 'https://360everywhere.com',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1877F2',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="360Everywhere" />
      </head>
      <body>{children}</body>
    </html>
  )
}
