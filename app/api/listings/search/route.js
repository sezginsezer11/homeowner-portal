import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePropertySlug } from '@/lib/propertySlug'

const RAPIDAPI_HOST = 'realtor-search.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'San Diego, CA'
  const limit = parseInt(searchParams.get('limit') || '12')

  try {
    const acRes = await fetch(
      `https://${RAPIDAPI_HOST}/properties/auto-complete?input=${encodeURIComponent(query)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()
    const cityResult = acData?.data?.autocomplete?.find(r => r.area_type === 'city') || acData?.data?.autocomplete?.[0]
    if (!cityResult) return NextResponse.json({ listings: [], error: 'Location not found' })

    const slugId = cityResult.slug_id
    const city   = cityResult.city
    const state  = cityResult.state_code

    const buyRes = await fetch(
      `https://${RAPIDAPI_HOST}/properties/search-buy?location=${encodeURIComponent(slugId)}&limit=${limit}`,
      { headers: HEADERS }
    )
    const buyData = await buyRes.json()
    const results = buyData?.data?.home_search?.results || []

    const supabase = await createClient()
    const listings = results.map(r => {
      const addr    = r?.location?.address
      const desc    = r?.description
      const address = addr?.line || ''
      const city    = addr?.city || ''
      const state   = addr?.state_code || 'CA'
      const zip     = addr?.postal_code || ''
      const slug    = generatePropertySlug(address, city, state, zip, null)

      if (address && zip) {
        supabase.from('property_profiles').upsert({
          slug, state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds: desc?.beds, baths: desc?.baths_consolidated || desc?.baths,
          sqft: desc?.sqft, year_built: desc?.year_built,
          property_type: desc?.type,
          photos: r?.primary_photo?.href ? [r.primary_photo.href] : [],
          latitude: r?.location?.address?.coordinate?.lat,
          longitude: r?.location?.address?.coordinate?.lon,
          listing_status: r?.status || 'active',
          list_price: r?.list_price,
          days_on_market: r?.days_on_market,
          price_reduced: r?.price_reduced_amount > 0,
          listing_id: r?.property_id,
          mls_id: r?.mls?.id,
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' }).then(() => {}).catch(() => {})
      }

      return {
        slug, address, city, state, zip,
        price: r?.list_price, beds: desc?.beds,
        baths: desc?.baths_consolidated || desc?.baths,
        sqft: desc?.sqft, year_built: desc?.year_built,
        photo: r?.primary_photo?.href,
        status: r?.status || 'active',
        days_on_market: r?.days_on_market,
        price_reduced: r?.price_reduced_amount > 0,
        property_type: desc?.type,
        listing_id: r?.property_id,
      }
    })

    return NextResponse.json({ listings, total: listings.length, location: slugId })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message })
  }
}
