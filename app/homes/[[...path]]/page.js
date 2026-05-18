import { createClient } from '@/lib/supabase/server'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import PropertyPageClient from './PropertyPageClient'

export async function generateMetadata({ params }) {
  const { path } = await params
  const pathStr = (path || []).join('/')
  // Extract address from path e.g. "CA/San-Diego/6568-Radio-Dr-92114/home/5855654"
  const parts = pathStr.split('/')
  const addressPart = parts[2] || ''
  const address = addressPart.replace(/-/g, ' ')
  return {
    title: `${address} | 360Everywhere`,
    description: `Property details and home value for ${address}`,
  }
}

export default async function PropertyPage({ params }) {
  const { path } = await params
  const pathStr = (path || []).join('/')
  const redfinUrl = `https://www.redfin.com/${pathStr}`

  // Check DB for cached data using redfin URL as key
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('property_profiles')
    .select('*')
    .eq('redfin_url', redfinUrl)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1">
        <PropertyPageClient
          profile={profile}
          redfinUrl={redfinUrl}
          pathStr={pathStr}
        />
      </main>
      <PublicFooter />
    </div>
  )
}
