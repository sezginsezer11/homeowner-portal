import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePropertySlug } from '@/lib/propertySlug'

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = 'realtor-search.p.rapidapi.com'
const HEADERS = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': RAPIDAPI_KEY,
}

// Fetch all available data for a property from Realtor API
async function fetchPropertyData(address, city, state, zip, unit) {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`
  const results = { building: null, listing: null, sold: null, similar: null, surroundings: null }

  try {
    // 1. Auto-complete to get property URL/ID
    const acRes = await fetch(
      `https://${RAPIDAPI_HOST}/properties/auto-complete?input=${encodeURIComponent(fullAddress)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()
    const prop = acData?.data?.[0] || acData?.autocomplete?.[0]
    const propUrl = prop?.permalink || prop?.href || null

    // 2. Property detail (building + listing data)
    if (propUrl) {
      try {
        const detailRes = await fetch(
          `https://${RAPIDAPI_HOST}/properties/detail?property_url=${encodeURIComponent(propUrl)}`,
          { headers: HEADERS }
        )
        const detail = await detailRes.json()
        const d = detail?.data?.home || detail?.data || detail

        results.building = {
          beds:          d?.description?.beds || d?.beds || null,
          baths:         d?.description?.baths_consolidated || d?.description?.baths || d?.baths || null,
          sqft:          d?.description?.sqft || d?.sqft || null,
          year_built:    d?.description?.year_built || d?.year_built || null,
          lot_size:      d?.description?.lot_sqft || d?.lot_size || null,
          property_type: d?.description?.type || d?.property_type || null,
          stories:       d?.description?.stories || null,
          parking:       d?.description?.garage || d?.parking || null,
          hoa_fee:       d?.hoa?.fee || null,
          heating:       d?.features?.cooling_and_heating?.[0] || null,
          cooling:       d?.features?.cooling_and_heating?.[1] || null,
          description:   d?.description?.text || d?.description?.name || null,
          photos:        (d?.photos || d?.photo || []).slice(0, 20).map(p => p?.href || p?.url || p),
          latitude:      d?.location?.address?.coordinate?.lat || d?.lat || null,
          longitude:     d?.location?.address?.coordinate?.lon || d?.lon || null,
          listing_id:    d?.property_id || d?.listing_id || null,
          mls_id:        d?.mls?.id || d?.mls_id || null,
          listing_agent: d?.advertisers?.[0] || d?.agent || null,
          estimated_value: d?.estimate?.estimate || d?.local?.price?.estimate?.estimate || null,
          avm_low:       d?.estimate?.low_estimate || null,
          avm_high:      d?.estimate?.high_estimate || null,
        }

        results.listing = {
          listing_status:        d?.status || 'unknown',
          list_price:            d?.list_price || d?.price || null,
          original_list_price:   d?.original_list_price || null,
          days_on_market:        d?.days_on_market || d?.list_date_delta || null,
          price_reduced:         d?.price_reduced_amount > 0,
        }
      } catch {}
    }

    // 3. Search-buy for active listing status (use zip for accuracy)
    try {
      const buyRes = await fetch(
        `https://${RAPIDAPI_HOST}/properties/search-buy?postal_code=${zip}&limit=5`,
        { headers: HEADERS }
      )
      const buyData = await buyRes.json()
      const match = (buyData?.data?.home_search?.results || []).find(r =>
        r?.location?.address?.line?.toLowerCase().includes(address.toLowerCase().split(' ')[1])
      )
      if (match) {
        results.listing = {
          listing_status:      match?.status || 'active',
          list_price:          match?.list_price || null,
          original_list_price: match?.original_list_price || null,
          days_on_market:      match?.days_on_market || null,
          price_reduced:       match?.price_reduced_amount > 0,
          listing_id:          match?.property_id || null,
          mls_id:              match?.mls?.id || null,
        }
      }
    } catch {}

    // 4. Sold history
    try {
      const soldRes = await fetch(
        `https://${RAPIDAPI_HOST}/properties/search-sold?postal_code=${zip}&limit=10`,
        { headers: HEADERS }
      )
      const soldData = await soldRes.json()
      const soldProps = soldData?.data?.home_search?.results || []
      const soldMatch = soldProps.find(r =>
        r?.location?.address?.line?.toLowerCase().includes(address.toLowerCase().split(' ')[1])
      )
      if (soldMatch) {
        results.sold = {
          last_sale_price: soldMatch?.list_price || null,
          last_sale_date:  soldMatch?.sold_date || soldMatch?.last_update_date || null,
        }
      }
      results.sold_history = soldProps.slice(0, 5).map(p => ({
        address:    p?.location?.address?.line,
        price:      p?.list_price,
        date:       p?.sold_date,
        beds:       p?.description?.beds,
        baths:      p?.description?.baths,
        sqft:       p?.description?.sqft,
      }))
    } catch {}

    // 5. Similar homes
    if (propUrl) {
      try {
        const simRes = await fetch(
          `https://${RAPIDAPI_HOST}/properties/similar-homes?property_url=${encodeURIComponent(propUrl)}&limit=6`,
          { headers: HEADERS }
        )
        const simData = await simRes.json()
        results.similar = (simData?.data || []).slice(0, 6).map(h => ({
          address:  h?.location?.address?.line,
          city:     h?.location?.address?.city,
          price:    h?.list_price,
          beds:     h?.description?.beds,
          baths:    h?.description?.baths,
          sqft:     h?.description?.sqft,
          photo:    h?.primary_photo?.href,
          url:      h?.permalink,
        }))
      } catch {}
    }

    // 6. Surroundings
    if (results.building?.latitude && results.building?.longitude) {
      try {
        const surRes = await fetch(
          `https://${RAPIDAPI_HOST}/properties/get-surroundings?lat=${results.building.latitude}&lon=${results.building.longitude}`,
          { headers: HEADERS }
        )
        const surData = await surRes.json()
        results.surroundings = {
          nearby_schools:    surData?.data?.schools?.results?.slice(0, 5) || [],
          walk_score:        surData?.data?.walk_score?.walk_score || null,
          noise_score:       surData?.data?.noise_score?.score || null,
          nearby_amenities:  surData?.data?.nearby_amenities?.results?.slice(0, 10) || [],
        }
      } catch {}
    }

  } catch (err) {
    console.error('Realtor API error:', err)
  }

  return results
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address  = searchParams.get('address')
  const city     = searchParams.get('city')
  const state    = searchParams.get('state') || 'CA'
  const zip      = searchParams.get('zip')
  const unit     = searchParams.get('unit') || null
  const force    = searchParams.get('force') === 'true'

  if (!address || !city || !zip) {
    return NextResponse.json({ error: 'Missing address, city, or zip' }, { status: 400 })
  }

  const supabase = await createClient()
  const slug = generatePropertySlug(address, city, state, zip, unit)

  // Check DB first
  const { data: existing } = await supabase
    .from('property_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  const now = new Date()
  const needsBuildingData = !existing?.building_data_fetched_at
  const needsListingUpdate = !existing?.listing_status_updated_at ||
    (now - new Date(existing.listing_status_updated_at)) > 23 * 60 * 60 * 1000 // 23 hours

  // Return cached if all fresh and not forced
  if (existing && !needsBuildingData && !needsListingUpdate && !force) {
    return NextResponse.json({ ...existing, cached: true, slug })
  }

  // Fetch from Realtor API
  const apiData = await fetchPropertyData(address, city, state, zip, unit)

  const profileData = {
    slug,
    state, city, address, zip, unit,
    full_address: `${address}, ${city}, ${state} ${zip}${unit ? ` ${unit}` : ''}`,
    updated_at: now.toISOString(),

    // Building data (only update if first time)
    ...(needsBuildingData || force ? {
      ...apiData.building,
      sold_history:        apiData.sold_history || [],
      similar_homes:       apiData.similar || [],
      ...(apiData.surroundings || {}),
      building_data_fetched_at: now.toISOString(),
      sold_data_fetched_at:     now.toISOString(),
      surroundings_fetched_at:  now.toISOString(),
    } : {}),

    // Listing status (always update if stale)
    ...(apiData.listing || {}),
    ...(apiData.sold || {}),
    listing_status_updated_at: now.toISOString(),
  }

  // Upsert into Supabase
  const { data: saved, error } = await supabase
    .from('property_profiles')
    .upsert(profileData, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    console.error('Supabase upsert error:', error)
    return NextResponse.json({ ...profileData, slug, db_error: error.message })
  }

  return NextResponse.json({ ...saved, slug, cached: false })
}
