import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePropertySlug } from '@/lib/propertySlug'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}
const api = (path) => `https://${HOST}/${path}`

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { headers: HEADERS })
    return await res.json()
  } catch { return null }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city    = searchParams.get('city')
  const state   = searchParams.get('state') || 'CA'
  const zip     = searchParams.get('zip')
  const unit    = searchParams.get('unit') || null
  const force   = searchParams.get('force') === 'true'

  if (!address || !city || !zip) {
    return NextResponse.json({ error: 'Missing address, city, or zip' }, { status: 400 })
  }

  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const slug = generatePropertySlug(address, city, state, zip, unit)

  // Check DB first
  const { data: existing } = await supabase
    .from('property_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  const now = new Date()
  const needsBuilding = !existing?.building_data_fetched_at || force
  const needsListing  = !existing?.listing_status_updated_at ||
    (now - new Date(existing.listing_status_updated_at)) > 23 * 60 * 60 * 1000

  // Return cached if fresh
  if (existing && !needsBuilding && !needsListing) {
    return NextResponse.json({ ...existing, slug, cached: true })
  }

  // Step 1: Auto-complete to get property URL
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
  const acData = await fetchJSON(api(`properties/auto-complete?query=${query}`))
  const propRow = acData?.data?.[0]?.rows?.[0]
  const propUrl = propRow?.url || null

  const profileData = {
    slug, state, city, address, zip, unit,
    full_address: `${address}, ${city}, ${state} ${zip}${unit ? ` ${unit}` : ''}`,
    updated_at: now.toISOString(),
  }

  // Step 2: Fetch all static data (only if first time or forced)
  if (needsBuilding && propUrl) {
    const [details, amenities, extraInfo, walkScore, floodInfo, agent, mainInfo] = await Promise.all([
      fetchJSON(api(`properties/details?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/amenities?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/extra-info?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/walk-score?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/flood-info?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/get-agent?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/main-info?url=${encodeURIComponent(propUrl)}`)),
    ])

    // Parse details
    const d = details?.data
    const atf = d?.aboveTheFold?.addressSectionInfo
    const btf = d?.belowTheFold

    // Flatten amenities
    const amenityEntries = (amenities?.data?.superGroups || btf?.amenitiesInfo?.superGroups || [])
      .flatMap(sg => (sg?.amenityGroups || []).flatMap(ag => ag?.amenityEntries || []))
    const findAmenity = (...terms) => {
      for (const term of terms) {
        const found = amenityEntries.find(a => a?.amenityName?.toLowerCase().includes(term.toLowerCase()))
        if (found?.amenityValues?.[0]) return found.amenityValues[0]
      }
      return null
    }

    // Public records (most reliable for sqft/year)
    const pr = btf?.publicRecordsInfo || extraInfo?.data?.publicRecordsInfo
    const sqft = pr?.sqFt || pr?.finishedSqFt || findAmenity('Sq. Ft', 'Square Feet', 'Living Area', 'Floor Area')
    const yearBuilt = pr?.yearBuilt || findAmenity('Year Built', 'Built in', 'Built')

    // Photos
    const photos = (d?.photos || []).slice(0, 20).map(p => p?.href || p?.url || p).filter(Boolean)

    // History
    const history = btf?.propertyHistoryInfo?.events || []
    const lastSale = history.find(e => e.historyEventType === 1 || e.eventDescription?.toLowerCase().includes('sold'))

    // Agent
    const agentData = agent?.data || d?.belowTheFold?.agentInfo
    const mainData  = mainInfo?.data

    // Walk scores
    const ws = walkScore?.data
    const flood = floodInfo?.data

    // Tax history from extra info
    const taxHistory = extraInfo?.data?.taxInfo || []

    Object.assign(profileData, {
      // Core building data
      beds:          atf?.beds || pr?.beds || null,
      baths:         atf?.baths || pr?.baths || null,
      sqft:          sqft ? parseInt(sqft.toString().replace(/[^0-9]/g,'')) : null,
      year_built:    yearBuilt ? parseInt(yearBuilt) : null,
      lot_size:      findAmenity('Lot Size', 'Lot Sq') ? parseInt(findAmenity('Lot Size', 'Lot Sq').toString().replace(/[^0-9]/g,'')) : (pr?.lotSize ? parseInt(pr.lotSize) : null),
      property_type: atf?.propertyType ? ({3:'Condo/Townhome',6:'Single Family',13:'Townhome',4:'Multi-Family',8:'Land'}[atf.propertyType] || 'Residential') : null,
      stories:       findAmenity('Stories', 'Floors') ? parseInt(findAmenity('Stories', 'Floors')) : null,
      parking:       findAmenity('Garage', 'Parking', 'Carport'),
      hoa_fee:       findAmenity('HOA', 'Association Fee') ? parseFloat(findAmenity('HOA','Association Fee').toString().replace(/[^0-9.]/g,'')) : null,
      heating:       findAmenity('Heat', 'Heating'),
      cooling:       findAmenity('Cool', 'A/C', 'Air'),
      description:   btf?.publicRecordsInfo?.propertyTypeName || null,
      photos,
      latitude:      mainData?.coordinates?.latitude || atf?.coordinates?.latitude || null,
      longitude:     mainData?.coordinates?.longitude || atf?.coordinates?.longitude || null,

      // Sale history
      last_sale_price: lastSale?.price || null,
      last_sale_date:  lastSale?.eventDateString ? new Date(lastSale.eventDateString).toISOString().split('T')[0] : null,
      sold_history:    history.slice(0,10).map(e => ({
        type:    e.eventDescription,
        price:   e.price,
        date:    e.eventDateString,
      })),

      // Scores
      walk_score:    ws?.walkscore || ws?.walk_score || null,
      noise_score:   ws?.noise?.score || null,
      transit_score: ws?.transit?.score || null,
      bike_score:    ws?.bike?.score || null,

      // Flood
      flood_zone:    flood?.floodZone || flood?.zone || null,
      flood_risk:    flood?.riskLevel || null,

      // Agent
      listing_agent: agentData ? {
        name:    agentData?.name || agentData?.agentName,
        phone:   agentData?.phone || agentData?.phoneNumber,
        company: agentData?.brokerageName || agentData?.company,
        photo:   agentData?.photoUrl || agentData?.photo,
      } : null,

      // AVM
      estimated_value: d?.avm?.predictedValue || atf?.avmInfo?.predictedValue || null,
      avm_low:         d?.avm?.predictedRangeLow || null,
      avm_high:        d?.avm?.predictedRangeHigh || null,

      // Tax
      tax_history: Array.isArray(taxHistory) ? taxHistory.slice(0,5) : [],

      // Timestamps
      building_data_fetched_at:  now.toISOString(),
      sold_data_fetched_at:      now.toISOString(),
      surroundings_fetched_at:   now.toISOString(),
    })
  }

  // Step 3: Always update listing status if stale
  if (needsListing && propUrl) {
    const [listingData, priceDrop, hotMarket] = await Promise.all([
      fetchJSON(api(`properties/main-info?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/price-drop-info?url=${encodeURIComponent(propUrl)}`)),
      fetchJSON(api(`properties/hot-market-info?url=${encodeURIComponent(propUrl)}`)),
    ])

    const li = listingData?.data
    const pd = priceDrop?.data
    const hm = hotMarket?.data

    Object.assign(profileData, {
      listing_status:           li?.mlsStatus || li?.status || (li?.isActivish ? 'active' : 'off_market'),
      list_price:               li?.price || li?.listPrice || null,
      original_list_price:      li?.originalListPrice || null,
      days_on_market:           li?.daysOnMarket || null,
      price_reduced:            pd?.hasPriceDrop || false,
      listing_id:               li?.listingId || li?.propertyId || null,
      mls_id:                   li?.mlsId || null,
      price_drop_info:          pd || null,
      hot_market_info:          hm || null,
      listing_status_updated_at: now.toISOString(),
    })
  }

  // Upsert to Supabase
  const { data: saved, error } = await serviceSupabase
    .from('property_profiles')
    .upsert(profileData, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ ...profileData, slug, cached: false, db_error: error.message })
  }

  return NextResponse.json({ ...saved, slug, cached: false })
}
