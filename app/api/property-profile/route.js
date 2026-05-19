import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { headers: HEADERS })
    return await res.json()
  } catch { return null }
}

function val(f) {
  if (f == null) return null
  if (typeof f === 'object') {
    if ('value' in f) return f.value ?? null
    return null
  }
  return f
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const redfinUrl = searchParams.get('redfin_url')
  const force     = searchParams.get('force') === 'true'

  // Also support address-based (for dashboard AVM)
  const address = searchParams.get('address')
  const city    = searchParams.get('city')
  const state   = searchParams.get('state') || 'CA'
  const zip     = searchParams.get('zip')

  if (!redfinUrl && !address) {
    return NextResponse.json({ error: 'Missing redfin_url or address' }, { status: 400 })
  }

  const supabase        = await createClient()
  const serviceSupabase = createServiceClient()

  let propRedfinUrl = redfinUrl

  // If address-based, get URL via autocomplete
  if (!redfinUrl && address) {
    const query  = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const acData = await fetchJSON(`https://${HOST}/properties/auto-complete?query=${query}`)
    const propRow = acData?.data?.[0]?.rows?.[0]
    if (!propRow?.url) return NextResponse.json({ found: false, error: 'Property not found' })
    propRedfinUrl = `https://www.redfin.com${propRow.url}`
  }

  // ALWAYS check DB first
  if (!force) {
    const { data: cached } = await supabase
      .from('property_profiles')
      .select('*')
      .eq('redfin_url', propRedfinUrl)
      .single()

    if (cached?.building_data_fetched_at) {
      // Check if listing status needs daily refresh
      const needsListingUpdate = !cached.listing_status_updated_at ||
        (Date.now() - new Date(cached.listing_status_updated_at).getTime()) > 23 * 60 * 60 * 1000

      if (!needsListingUpdate) {
        // Fully cached - return immediately, NO API call
        return NextResponse.json({ ...cached, cached: true })
      }

      // Only refresh listing status (1 API call)
      const urlPath = propRedfinUrl.replace('https://www.redfin.com', '')
      const [mainInfo, priceDrop] = await Promise.all([
        fetchJSON(`https://${HOST}/properties/main-info?url=${encodeURIComponent(urlPath)}`),
        fetchJSON(`https://${HOST}/properties/price-drop-info?url=${encodeURIComponent(urlPath)}`),
      ])
      const li = mainInfo?.data
      const update = {
        listing_status: li?.mlsStatus || cached.listing_status,
        list_price: val(li?.price) || cached.list_price,
        days_on_market: li?.daysOnMarket || cached.days_on_market,
        price_reduced: priceDrop?.data?.hasPriceDrop || false,
        listing_status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await serviceSupabase.from('property_profiles').update(update).eq('redfin_url', propRedfinUrl)
      return NextResponse.json({ ...cached, ...update, cached: true, listing_refreshed: true })
    }
  }

  // Not in DB yet - fetch ALL data (multiple API calls, but only happens once ever)
  const urlPath = propRedfinUrl.replace('https://www.redfin.com', '')
  const now = new Date()

  const [details, amenities, extraInfo, walkScore, floodInfo, agent, mainInfo, priceDrop] = await Promise.all([
    fetchJSON(`https://${HOST}/properties/details?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/amenities?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/extra-info?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/walk-score?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/flood-info?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/get-agent?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/main-info?url=${encodeURIComponent(urlPath)}`),
    fetchJSON(`https://${HOST}/properties/price-drop-info?url=${encodeURIComponent(urlPath)}`),
  ])

  const d   = details?.data
  const atf = d?.aboveTheFold?.addressSectionInfo
  const btf = d?.belowTheFold
  const pr  = btf?.publicRecordsInfo || extraInfo?.data?.publicRecordsInfo

  const amenityEntries = (amenities?.data?.superGroups || btf?.amenitiesInfo?.superGroups || [])
    .flatMap(sg => (sg?.amenityGroups || []).flatMap(ag => ag?.amenityEntries || []))
  const findAmenity = (...terms) => {
    for (const term of terms) {
      const found = amenityEntries.find(a => a?.amenityName?.toLowerCase().includes(term.toLowerCase()))
      if (found?.amenityValues?.[0]) return found.amenityValues[0]
    }
    return null
  }

  const sqft      = pr?.sqFt || pr?.finishedSqFt || findAmenity('Sq. Ft', 'Square Feet', 'Living Area')
  const yearBuilt = pr?.yearBuilt || findAmenity('Year Built', 'Built in', 'Built')
  const photos    = (d?.photos || []).slice(0, 20).map(p => p?.href || p?.url || p).filter(p => typeof p === 'string')
  const history   = btf?.propertyHistoryInfo?.events || []
  const lastSale  = history.find(e => e.historyEventType === 1 || e.eventDescription?.toLowerCase().includes('sold'))
  const ws        = walkScore?.data
  const flood     = floodInfo?.data
  const agentData = agent?.data
  const li        = mainInfo?.data

  const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

  const profileData = {
    redfin_url: propRedfinUrl,
    address:    address || null,
    city:       city || null,
    state, zip,
    full_address: address ? `${address}, ${city}, ${state} ${zip}` : null,
    beds:       atf?.beds || pr?.beds || null,
    baths:      atf?.baths || pr?.baths || null,
    sqft:       sqft ? parseInt(sqft.toString().replace(/[^0-9]/g,'')) : null,
    year_built: yearBuilt ? parseInt(yearBuilt) : null,
    lot_size:   pr?.lotSize ? parseInt(pr.lotSize) : null,
    property_type: atf?.propertyType ? (propTypeMap[atf.propertyType] || 'Residential') : null,
    stories:    findAmenity('Stories', 'Floors') ? parseInt(findAmenity('Stories','Floors')) : null,
    parking:    findAmenity('Garage', 'Parking', 'Carport'),
    hoa_fee:    findAmenity('HOA', 'Association Fee') ? parseFloat(findAmenity('HOA','Association Fee').toString().replace(/[^0-9.]/g,'')) : null,
    heating:    findAmenity('Heat', 'Heating'),
    cooling:    findAmenity('Cool', 'A/C', 'Air'),
    photos,
    latitude:   atf?.coordinates?.latitude || null,
    longitude:  atf?.coordinates?.longitude || null,
    last_sale_price: lastSale?.price || null,
    last_sale_date: lastSale?.eventDateString ? new Date(lastSale.eventDateString).toISOString().split('T')[0] : null,
    sold_history: history.slice(0,10).map(e => ({ type: e.eventDescription, price: e.price, date: e.eventDateString })),
    walk_score:    ws?.walkscore || null,
    transit_score: ws?.transit?.score || null,
    bike_score:    ws?.bike?.score || null,
    noise_score:   ws?.noise?.score || null,
    flood_zone:    flood?.floodZone || null,
    flood_risk:    flood?.riskLevel || null,
    listing_agent: agentData ? {
      name:    agentData?.name || agentData?.agentName,
      phone:   agentData?.phone || agentData?.phoneNumber,
      company: agentData?.brokerageName || agentData?.company,
      photo:   agentData?.photoUrl || agentData?.photo,
    } : null,
    estimated_value: d?.avm?.predictedValue || atf?.avmInfo?.predictedValue || null,
    avm_low:    d?.avm?.predictedRangeLow || null,
    avm_high:   d?.avm?.predictedRangeHigh || null,
    tax_history: Array.isArray(extraInfo?.data?.taxInfo) ? extraInfo.data.taxInfo.slice(0,5) : [],
    // Listing status
    listing_status: li?.mlsStatus || 'Active',
    list_price:     val(li?.price) || null,
    days_on_market: li?.daysOnMarket || null,
    price_reduced:  priceDrop?.data?.hasPriceDrop || false,
    listing_id:     li?.listingId || null,
    mls_id:         val(li?.mlsId) || null,
    // Timestamps
    building_data_fetched_at:  now.toISOString(),
    sold_data_fetched_at:      now.toISOString(),
    listing_status_updated_at: now.toISOString(),
    updated_at: now.toISOString(),
  }

  const { data: saved, error } = await serviceSupabase
    .from('property_profiles')
    .upsert(profileData, { onConflict: 'redfin_url' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ...profileData, cached: false, db_error: error.message })
  }

  return NextResponse.json({ ...saved, cached: false })
}
