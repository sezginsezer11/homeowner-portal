import { createClient } from '@/lib/supabase/server'
import { parsePropertySlug, generatePropertySlug } from '@/lib/propertySlug'
import PropertyPageClient from '../PropertyPageClient'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export default async function PropertyUnitPage({ params }) {
  const { state, city, addressZip, unit } = await params
  const parsed = parsePropertySlug(state, city, addressZip, unit)
  const slug   = generatePropertySlug(parsed.address, parsed.city, state, parsed.zip, parsed.unit)

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
        <PropertyPageClient profile={profile} slug={slug} parsed={parsed} state={state} city={city} addressZip={addressZip}/>
      </main>
      <PublicFooter />
    </div>
  )
}
