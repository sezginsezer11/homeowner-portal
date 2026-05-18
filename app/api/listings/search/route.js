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
  const query  = searchParams.get('query') || 'San Diego, CA'
  const limit  = parseInt(searchParams.get('limit') || '12')

  // Parse city/state from query
  const parts = query.split(',').map(s => s.trim())
  const city  = parts[0] || 'San Diego'
  const state = parts[1]?.trim().split(' ')[0] || 'CA'
  const zip   = parts[0]?.match(/\d{5}/) ? parts[0].match(/\d{5}/)[0] : null

  try {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (zip) { params.set('postal_code', zip) }
    else {
      params.set('city', city)
      params.set('state_code', state)
    }

    const res = await fetch(
      `https://${RAPIDAPI_HOST}/properties/search-buy?${params}`,
      { headers: HEADERS }
    )
    const data = await res.json()
    const results = data?.data?.home_search?.results || data?.data?.results || []

    // Transform to our format + save to DB for future use
    const supabase = await createClient()
    const listings = results.map(r => {
      const addr    = r?.location?.address
      const desc    = r?.description
      const address = addr?.line || ''
      const city    = addr?.city || ''
      const state   = addr?.state_code || 'CA'
      const zip     = addr?.postal_code || ''
      const slug    = generatePropertySlug(address, city, state, zip, null)

      // Save to property_profiles in background (don't await)
      supabase.from('property_profiles').upsert({
        slug, state, city, address, zip,
        full_address: `${address}, ${city}, ${state} ${zip}`,
        beds: desc?.beds,
        baths: desc?.baths_consolidated || desc?.baths,
        sqft: desc?.sqft,
        year_built: desc?.year_built,
        property_type: desc?.type,
        photos: r?.primary_photo?.href ? [r.primary_photo.href] : [],
        latitude: r?.location?.address?.coordinate?.lat,
        longitude: r?.location?.address?.coordinate?.lon,
        listing_status: r?.status || 'active',
        list_price: r?.list_price,
        original_list_price: r?.original_list_price,
        days_on_market: r?.days_on_market,
        price_reduced: r?.price_reduced_amount > 0,
        listing_id: r?.property_id,
        mls_id: r?.mls?.id,
        listing_status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug', ignoreDuplicates: false }).then(() => {}).catch(() => {})

      return {
        slug,
        address, city, state, zip,
        price:       r?.list_price,
        beds:        desc?.beds,
        baths:       desc?.baths_consolidated || desc?.baths,
        sqft:        desc?.sqft,
        year_built:  desc?.year_built,
        photo:       r?.primary_photo?.href,
        photos:      r?.photos?.slice(0,5).map(p => p?.href) || [],
        status:      r?.status || 'active',
        days_on_market: r?.days_on_market,
        price_reduced: r?.price_reduced_amount > 0,
        listing_id:  r?.property_id,
      }
    })

    return NextResponse.json({ listings, total: listings.length })
  } catch (err) {
    console.error('Listings search error:', err)
    return NextResponse.json({ listings: [], error: err.message })
  }
}
