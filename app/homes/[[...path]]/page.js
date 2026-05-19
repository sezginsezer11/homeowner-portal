import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import PropertyPageClient from './PropertyPageClient'

export async function generateMetadata({ params }) {
  const { path } = await params
  const pathStr = (path || []).join('/')
  const parts = pathStr.split('/')
  const address = (parts[2] || '').replace(/-/g, ' ')
  const city = (parts[1] || '').replace(/-/g, ' ')
  return {
    title: `${address}, ${city} | 360Everywhere`,
    description: `Property details, home value, photos and listing info for ${address}, ${city}.`,
  }
}

export default async function PropertyPage({ params }) {
  const { path } = await params
  const pathStr = (path || []).join('/')
  const redfinUrl = `https://www.redfin.com/${pathStr}`

  // Don't pre-fetch - let client handle it for fresh data
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1">
        <PropertyPageClient
          profile={null}
          redfinUrl={redfinUrl}
          pathStr={pathStr}
        />
      </main>
      <PublicFooter />
    </div>
  )
}
