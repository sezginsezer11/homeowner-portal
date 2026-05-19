import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

const CACHE_HOURS = 24 // Cache search results for 24 hours

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
    if (parts.length) return s.unitValue ? `${parts.join(' ')} ${s.unitValue}` : parts.join(' ')
  }
  return ''
}

function transformHome(h) {
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
  const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }
  const propType = propTypeMap[h?.propertyType] || 'Residential'
  const redfinUrl = h?.url ? `https://www.redfin.com${h.url}` : null
  const pricePerSqft = val(h?.pricePerSqFt)
  const lotSize  = val(h?.lotSize)
  const yearBuilt = val(h?.yearBuilt)

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
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query      = searchParams.get('query') || 'San Diego, CA'
  const limit      = Math.min(parseInt(searchParams.get('limit') || '5'), 5)
  const type       = searchParams.get('type') || 'sale'
  const cacheKey   = `${query.toLowerCase().trim()}:${type}`

  const supabase        = await createClient()
  const serviceSupabase = createServiceClient()

  // Step 1: Check search cache first
  const { data: cached } = await supabase
    .from('search_cache')
    .select('results, region, expires_at')
    .eq('query', cacheKey)
    .single()

  if (cached && new Date(cached.expires_at) > new Date()) {
    // Cache hit — zero API calls
    return NextResponse.json({
      listings: cached.results,
      total: cached.results.length,
      region: cached.region,
      cached: true,
    })
  }

  // Step 2: Cache miss — call Redfin API
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
      `https://${HOST}/properties/${endpoint}?url=${encodeURIComponent(regionUrl)}&limit=10`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const homes = (searchData?.data?.homes || []).slice(0, limit)
    const listings = homes.map(transformHome)

    // Step 3: Save results to search cache for 24 hours
    const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString()
    serviceSupabase.from('search_cache').upsert({
      query: cacheKey,
      results: listings,
      region: region.name,
      expires_at: expiresAt,
    }, { onConflict: 'query' }).then(() => {}).catch(() => {})

    // Step 4: Save each property to property_profiles in background
    listings.forEach(l => {
      if (l.address && l.zip && l.redfin_url) {
        serviceSupabase.from('property_profiles').upsert({
          redfin_url:    l.redfin_url,
          state:         l.state,
          city:          l.city,
          address:       l.address,
          zip:           l.zip,
          full_address:  `${l.address}, ${l.city}, ${l.state} ${l.zip}`,
          beds:          l.beds,
          baths:         l.baths,
          sqft:          l.sqft,
          year_built:    l.year_built,
          property_type: l.property_type,
          photos:        l.photos,
          latitude:      l.lat,
          longitude:     l.lon,
          listing_status: l.status,
          list_price:    l.price,
          days_on_market: l.days_on_market,
          price_reduced: l.price_reduced,
          listing_id:    l.listing_id,
          price_per_sqft: l.price_per_sqft,
          lot_size:      l.lot_size,
          listing_remarks: l.listing_remarks,
          has_3d_tour:   l.has_3d_tour,
          has_virtual_tour: l.has_virtual_tour,
          is_new_construction: l.is_new_construction,
          open_house:    l.open_house,
          listing_status_updated_at: new Date().toISOString(),
          updated_at:    new Date().toISOString(),
        }, { onConflict: 'redfin_url' }).then(() => {}).catch(() => {})
      }
    })

    return NextResponse.json({
      listings,
      total: listings.length,
      region: region.name,
      cached: false,
    })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message })
  }
}
