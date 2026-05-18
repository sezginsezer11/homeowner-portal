import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RAPIDAPI_HOST = 'realtor-search.p.rapidapi.com'
const HEADERS = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  const { data: profiles } = await supabase
    .from('property_profiles')
    .select('id, slug, zip, address')
    .or(`listing_status_updated_at.lt.${cutoff},listing_status_updated_at.is.null`)
    .limit(50)

  if (!profiles?.length) return NextResponse.json({ updated: 0 })

  let updated = 0
  const now = new Date().toISOString()
  const byZip = profiles.reduce((acc, p) => { if (!acc[p.zip]) acc[p.zip] = []; acc[p.zip].push(p); return acc }, {})

  for (const [zip, zipProfiles] of Object.entries(byZip)) {
    try {
      const res = await fetch(`https://${RAPIDAPI_HOST}/properties/search-buy?postal_code=${zip}&limit=50`, { headers: HEADERS })
      const data = await res.json()
      const listings = data?.data?.home_search?.results || []
      for (const profile of zipProfiles) {
        const match = listings.find(l => l?.location?.address?.line?.toLowerCase().includes(profile.address.toLowerCase().split(' ')[1] || ''))
        await supabase.from('property_profiles').update({
          listing_status: match ? (match.status || 'active') : 'off_market',
          list_price: match?.list_price || null,
          days_on_market: match?.days_on_market || null,
          price_reduced: match?.price_reduced_amount > 0,
          listing_status_updated_at: now,
          updated_at: now,
        }).eq('id', profile.id)
        updated++
      }
      await new Promise(r => setTimeout(r, 200))
    } catch (err) { console.error(`Zip ${zip} error:`, err) }
  }

  return NextResponse.json({ updated, total: profiles.length })
}
