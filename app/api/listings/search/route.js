import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePropertySlug } from '@/lib/propertySlug'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

function val(f) {
  if (f == null) return null
  if (typeof f === 'object' && 'value' in f) return f.value
  return f
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

    const regionUrl = `https://www.redfin.com${region.url}`
    const endpoint  = type === 'rent' ? 'search-rent' : 'search-by-url'

    const searchRes = await fetch(
      `https://${HOST}/properties/${endpoint}?url=${encodeURIComponent(regionUrl)}&limit=${limit}`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = searchData?.data?.homes || []

    const serviceSupabase = createServiceClient()
    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

    const listings = homes.map(h => {
      // Address can be nested object or {level,value} or string
      const streetLineRaw = h?.streetLine
      let address = ''
      if (typeof streetLineRaw === 'string') address = streetLineRaw
      else if (streetLineRaw?.value) address = streetLineRaw.value
      else if (streetLineRaw?.streetNumber) {
        address = [streetLineRaw.streetNumber, streetLineRaw.streetName, streetLineRaw.streetType].filter(Boolean).join(' ')
        if (streetLineRaw.unitValue) address += ' ' + streetLineRaw.unitValue
      }
      const city    = h?.city || ''
      const state   = h?.state || 'CA'
      const zip     = val(h?.zip) || val(h?.postalCode) || ''
      const price   = val(h?.price)
      const sqft    = val(h?.sqFt)
      const beds    = val(h?.beds)
      const baths   = val(h?.baths)
      const photos  = h?.photos?.items || []
      const photo   = photos[0] || null
      const latLong = val(h?.latLong)
      const lat     = latLong?.latitude || null
      const lon     = latLong?.longitude || null
      const slug    = generatePropertySlug(address, city, state, zip, null)
      const status  = h?.mlsStatus || 'Active'
      const dom     = val(h?.dom)
      const propType = propTypeMap[h?.propertyType] || 'Residential'

      if (address && zip) {
        serviceSupabase.from('property_profiles').upsert({
          slug, state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds, baths, sqft,
          year_built:    val(h?.yearBuilt),
          property_type: propType,
          photos:        photos.slice(0,10),
          latitude:      lat,
          longitude:     lon,
          listing_status: status.toLowerCase().replace(' ', '_'),
          list_price:    price,
          days_on_market: dom,
          price_reduced: h?.isHot || false,
          listing_id:    h?.listingId,
          mls_id:        val(h?.mlsId),
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' }).then(() => {}).catch(() => {})
      }

      return {
        slug, address, city, state, zip,
        price, beds, baths, sqft,
        year_built:      val(h?.yearBuilt),
        property_type:   propType,
        photo, photos:   photos.slice(0,10),
        status,
        days_on_market:  dom,
        price_reduced:   h?.isHot || false,
        is_new_construction: h?.isNewConstruction || false,
        listing_id:      h?.listingId,
        mls_id:          val(h?.mlsId),
        url:             h?.url,
        open_house:      h?.openHouseStartFormatted || null,
        lot_size:        val(h?.lotSize),
        price_per_sqft:  val(h?.pricePerSqFt),
        listing_remarks: h?.listingRemarks || null,
        has_3d_tour:     h?.has3DTour || false,
        has_virtual_tour: h?.hasVirtualTour || false,
        location:        val(h?.location),
        key_facts:       h?.keyFacts || [],
        sashes:          h?.sashes || [],
        lat, lon,
      }
    })

    return NextResponse.json({ listings, total: listings.length, region: region.name })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message })
  }
}
