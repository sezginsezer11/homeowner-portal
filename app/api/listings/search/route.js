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
  const query = searchParams.get('query') || 'San Diego, CA'
  const limit = parseInt(searchParams.get('limit') || '12')
  const type  = searchParams.get('type') || 'sale'

  try {
    const acRes = await fetch(
      `https://${HOST}/properties/auto-complete?query=${encodeURIComponent(query)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()

    const placeRows = acData?.data?.[0]?.rows || []
    const region = placeRows.find(r => r.type === '2' || r.type === '5') || placeRows[0]
    if (!region) return NextResponse.json({ listings: [], error: 'Location not found' })

    const idParts    = region.id.split('_')
    const regionType = idParts[0]
    const regionId   = idParts[1]

    const endpoint = type === 'rent' ? 'search-rent' : type === 'sold' ? 'search-sold' : 'search-sale'
    const searchRes = await fetch(
      `https://${HOST}/properties/${endpoint}?regionId=${regionId}&regionType=${regionType}&limit=${limit}&sort=1`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = searchData?.data?.homes || searchData?.data?.results || []

    const supabase = await createClient()
    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

    const listings = homes.map(h => {
      const address = h?.streetLine || ''
      const city    = h?.city || ''
      const state   = h?.state || 'CA'
      const zip     = h?.zip || h?.postalCode || ''
      const slug    = generatePropertySlug(address, city, state, zip, null)

      if (address && zip) {
        supabase.from('property_profiles').upsert({
          slug, state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds: h?.beds, baths: h?.baths,
          sqft: h?.sqFt || h?.sqft,
          year_built: h?.yearBuilt,
          property_type: propTypeMap[h?.propertyType] || null,
          photos: h?.photos?.slice(0,5).filter(Boolean) || [],
          latitude: h?.latLong?.latitude,
          longitude: h?.latLong?.longitude,
          listing_status: type === 'sold' ? 'sold' : 'active',
          list_price: h?.price?.value || h?.price,
          days_on_market: h?.daysOnMarket,
          price_reduced: h?.isHot || false,
          listing_id: h?.listingId || h?.mlsId,
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' }).then(() => {}).catch(() => {})
      }

      return {
        slug, address, city, state, zip,
        price:          h?.price?.value || h?.price,
        beds:           h?.beds,
        baths:          h?.baths,
        sqft:           h?.sqFt || h?.sqft,
        year_built:     h?.yearBuilt,
        property_type:  propTypeMap[h?.propertyType] || 'Residential',
        photo:          h?.photos?.[0] || null,
        status:         type === 'sold' ? 'sold' : 'active',
        days_on_market: h?.daysOnMarket,
        price_reduced:  h?.isHot || false,
        listing_id:     h?.listingId,
        url:            h?.url,
      }
    })

    return NextResponse.json({ listings, total: listings.length, regionId, regionType, region: region.name })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ listings: [], error: err.message })
  }
}
