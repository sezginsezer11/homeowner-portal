import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePropertySlug } from '@/lib/propertySlug'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

function val(field) {
  if (!field) return null
  if (typeof field === 'object' && 'value' in field) return field.value
  return field
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'San Diego, CA'
  const limit = parseInt(searchParams.get('limit') || '12')
  const type  = searchParams.get('type') || 'sale'

  try {
    // Step 1: Autocomplete to get region URL
    const acRes = await fetch(
      `https://${HOST}/properties/auto-complete?query=${encodeURIComponent(query)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()
    const placeRows = acData?.data?.[0]?.rows || []
    const region = placeRows.find(r => r.type === '2' || r.type === '5') || placeRows[0]
    if (!region) return NextResponse.json({ listings: [], error: 'Location not found' })

    const regionUrl = `https://www.redfin.com${region.url}`

    // Step 2: Search by URL
    const endpoint = type === 'rent' ? 'search-rent' : 'search-by-url'
    const searchRes = await fetch(
      `https://${HOST}/properties/${endpoint}?url=${encodeURIComponent(regionUrl)}&limit=${limit}`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = searchData?.data?.homes || []

    const serviceSupabase = createServiceClient()
    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

    const listings = homes.map(h => {
      const address = val(h?.streetLine) || val(h?.address) || ''
      const city    = h?.city || ''
      const state   = h?.state || 'CA'
      const zip     = h?.zip || h?.postalCode || ''
      const price   = val(h?.price)
      const sqft    = val(h?.sqFt) || val(h?.sqft)
      const beds    = val(h?.beds)
      const baths   = val(h?.baths)
      const photo   = h?.photos?.[0] || h?.primaryPhoto || null
      const slug    = generatePropertySlug(address, city, state, zip, null)

      if (address && zip) {
        serviceSupabase.from('property_profiles').upsert({
          slug, state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds, baths, sqft,
          year_built: h?.yearBuilt,
          property_type: propTypeMap[h?.propertyType] || null,
          photos: [photo].filter(Boolean),
          latitude: h?.latLong?.latitude,
          longitude: h?.latLong?.longitude,
          listing_status: 'active',
          list_price: price,
          days_on_market: h?.daysOnMarket,
          price_reduced: h?.isHot || false,
          listing_id: h?.listingId || h?.mlsId,
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' }).then(() => {}).catch(() => {})
      }

      return {
        slug, address, city, state, zip,
        price, beds, baths, sqft,
        year_built:     h?.yearBuilt,
        property_type:  propTypeMap[h?.propertyType] || 'Residential',
        photo,
        status:         'active',
        days_on_market: h?.daysOnMarket,
        price_reduced:  h?.isHot || false,
        listing_id:     h?.listingId,
        url:            h?.url,
      }
    })

    return NextResponse.json({ listings, total: listings.length, region: region.name })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message })
  }
}
