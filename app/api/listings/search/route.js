import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

function val(f) {
  if (f == null) return null
  if (typeof f === 'object') {
    if ('value' in f) return f.value ?? null
    return null
  }
  return f
}

function parseAddress(h) {
  const s = h?.streetLine
  if (!s) return ''
  if (typeof s === 'string') return s
  if (typeof s === 'object') {
    if (s.value && typeof s.value === 'string') return s.value
    const parts = [s.streetNumber, s.streetName, s.streetType].filter(Boolean)
    if (parts.length) {
      const addr = parts.join(' ')
      return s.unitValue ? `${addr} ${s.unitValue}` : addr
    }
  }
  return ''
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'San Diego, CA'
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 5) // Max 5
  const type  = searchParams.get('type') || 'sale'

  try {
    // Step 1: Autocomplete
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

    // Step 2: Search - fetch slightly more so we can filter, but cap at 5 results
    const searchRes = await fetch(
      `https://${HOST}/properties/${endpoint}?url=${encodeURIComponent(regionUrl)}&limit=10`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = (searchData?.data?.homes || []).slice(0, limit)

    const serviceSupabase = createServiceClient()
    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

    const listings = homes.map(h => {
      const address  = parseAddress(h)
      const city     = typeof h?.city === 'string' ? h.city : val(h?.city) || ''
      const state    = typeof h?.state === 'string' ? h.state : 'CA'
      const zip      = val(h?.zip) || val(h?.postalCode) || ''
      const price    = val(h?.price)
      const photos   = h?.photos?.items || []
      const photo    = typeof photos[0] === 'string' ? photos[0] : null
      const sqft     = val(h?.sqFt)
      const beds     = val(h?.beds)
      const baths    = val(h?.baths)
      const latLong  = val(h?.latLong)
      const lat      = typeof latLong === 'object' ? latLong?.latitude : null
      const lon      = typeof latLong === 'object' ? latLong?.longitude : null
      const status   = typeof h?.mlsStatus === 'string' ? h.mlsStatus : 'Active'
      const dom      = val(h?.dom)
      const propType = propTypeMap[h?.propertyType] || 'Residential'
      const redfinUrl = h?.url ? `https://www.redfin.com${h.url}` : null
      const pricePerSqft = val(h?.pricePerSqFt)
      const lotSize  = val(h?.lotSize)
      const yearBuilt = val(h?.yearBuilt)

      // Save to DB with redfin_url as key (background, don't await)
      if (address && zip && redfinUrl) {
        serviceSupabase.from('property_profiles').upsert({
          redfin_url: redfinUrl,
          state, city, address, zip,
          full_address: `${address}, ${city}, ${state} ${zip}`,
          beds, baths, sqft, year_built: yearBuilt,
          property_type: propType,
          photos: photos.filter(p => typeof p === 'string').slice(0, 10),
          latitude: lat, longitude: lon,
          listing_status: status,
          list_price: price,
          days_on_market: dom,
          price_reduced: h?.isHot || false,
          listing_id: h?.listingId || null,
          mls_id: val(h?.mlsId),
          price_per_sqft: pricePerSqft,
          lot_size: lotSize,
          listing_remarks: typeof h?.listingRemarks === 'string' ? h.listingRemarks : null,
          has_3d_tour: h?.has3DTour || false,
          has_virtual_tour: h?.hasVirtualTour || false,
          is_new_construction: h?.isNewConstruction || false,
          open_house: typeof h?.openHouseStartFormatted === 'string' ? h.openHouseStartFormatted : null,
          listing_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'redfin_url' }).then(() => {}).catch(() => {})
      }

      return {
        redfin_url: redfinUrl,
        address, city, state, zip,
        price, beds, baths, sqft,
        year_built:      yearBuilt,
        property_type:   propType,
        photo,
        photos:          photos.filter(p => typeof p === 'string').slice(0, 10),
        status,
        days_on_market:  dom,
        price_reduced:   h?.isHot || false,
        is_new_construction: h?.isNewConstruction || false,
        listing_id:      h?.listingId || null,
        url:             typeof h?.url === 'string' ? h.url : null,
        open_house:      typeof h?.openHouseStartFormatted === 'string' ? h.openHouseStartFormatted : null,
        lot_size:        lotSize,
        price_per_sqft:  pricePerSqft,
        listing_remarks: typeof h?.listingRemarks === 'string' ? h.listingRemarks : null,
        has_3d_tour:     h?.has3DTour || false,
        has_virtual_tour: h?.hasVirtualTour || false,
        lat, lon,
      }
    })

    return NextResponse.json({ listings, total: listings.length, region: region.name })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message })
  }
}
