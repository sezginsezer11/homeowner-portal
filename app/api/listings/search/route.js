import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePropertySlug } from '@/lib/propertySlug'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query  = searchParams.get('query') || 'San Diego, CA'
  const limit  = parseInt(searchParams.get('limit') || '12')
  const type   = searchParams.get('type') || 'sale' // sale | rent | sold

  try {
    // Step 1: Auto-complete to get region
    const acRes = await fetch(
      `https://${HOST}/properties/auto-complete?query=${encodeURIComponent(query)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()
    const region = acData?.data?.[0]?.rows?.[0]
    if (!region) return NextResponse.json({ listings: [], error: 'Location not found' })

    const regionId   = region.id?.split('_')?.[0] || region.id
    const regionType = region.type || '6'

    // Step 2: Search for properties
    const endpoint = type === 'rent' ? 'search-rent' : type === 'sold' ? 'search-sold' : 'search-sale'
    const searchRes = await fetch(
      `https://${HOST}/properties/${endpoint}?regionId=${regionId}&regionType=${regionType}&limit=${limit}&sort=1`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = searchData?.data?.homes || searchData?.data?.results || []

    // Step 3: Transform + save to DB
    const supabase = await createClient()
    const listings = await Promise.all(homes.map(async (h) => {
      const address = h?.streetLine || h?.address?.streetLine || ''
      const city    = h?.city || h?.address?.city || ''
      const state   = h?.state || h?.address?.state || 'CA'
      const zip     = h?.zip || h?.address?.zip || h?.postalCode || ''
      const slug    = generatePropertySlug(address, city, state, zip, null)

      const propTypeMap = {3:'Condo/Townhome',6:'Single Family',13:'Townhome',4:'Multi-Family',8:'Land'}

      const listing = {
        slug, address, city, state, zip,
        price:          h?.price?.value || h?.price || null,
        beds:           h?.beds || null,
        baths:          h?.baths || null,
        sqft:           h?.sqFt || h?.sqft || null,
        year_built:     h?.yearBuilt || null,
        property_type:  propTypeMap[h?.propertyType] || 'Residential',
        photo:          h?.photos?.[0] || h?.primaryPhoto || null,
        photos:         (h?.photos || []).slice(0, 5),
        status:         type === 'sold' ? 'sold' : (h?.soldDate ? 'sold' : 'active'),
        days_on_market: h?.daysOnMarket || null,
        price_reduced:  h?.isHot || false,
        listing_id:     h?.listingId || h?.mlsId || null,
        lat:            h?.latLong?.latitude || null,
        lon:            h?.latLong?.longitude || null,
        url:            h?.url || null,
      }

      // Save to property_profiles in background
      if (address && zip) {
        supabase.from('property_profiles').upsert({
          slug, state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds: listing.beds, baths: listing.baths,
          sqft: listing.sqft, year_built: listing.year_built,
          property_type: listing.property_type,
          photos: listing.photos.filter(Boolean),
          latitude: listing.lat,
          longitude: listing.lon,
          listing_status: listing.status,
          list_price: listing.price,
          days_on_market: listing.days_on_market,
          price_reduced: listing.price_reduced,
          listing_id: listing.listing_id,
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' }).then(() => {}).catch(() => {})
      }

      return listing
    }))

    return NextResponse.json({ listings, total: listings.length, region: region.name || query })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ listings: [], error: err.message })
  }
}
