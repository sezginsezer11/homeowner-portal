import { createClient } from '@/lib/supabase/server'
import { parsePropertySlug, generatePropertySlug } from '@/lib/propertySlug'
import PropertyPageClient from './PropertyPageClient'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export async function generateMetadata({ params }) {
  const { state, city, addressZip } = await params
  const { address, zip } = parsePropertySlug(state, city, addressZip, null)
  return {
    title: `${address}, ${city.replace(/-/g,' ')}, ${state} ${zip} | 360Everywhere`,
    description: `Property details, home value, and listing information for ${address}, ${city.replace(/-/g,' ')}, ${state}.`,
  }
}

export default async function PropertyPage({ params }) {
  const { state, city, addressZip } = await params
  const parsed = parsePropertySlug(state, city, addressZip, null)
  const slug   = generatePropertySlug(parsed.address, parsed.city, state, parsed.zip, null)

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('property_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1">
        <PropertyPageClient
          profile={profile}
          slug={slug}
          parsed={parsed}
          state={state}
          city={city}
          addressZip={addressZip}
        />
      </main>
      <PublicFooter />
    </div>
  )
}
