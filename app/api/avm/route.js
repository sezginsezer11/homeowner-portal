import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const CACHE_DAYS = 29 // 29-day AVM cache

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

function val(f) {
  if (f == null) return null
  if (typeof f === 'object' && 'value' in f) return f.value ?? null
  return f
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address     = searchParams.get('address')
  const city        = searchParams.get('city')
  const state       = searchParams.get('state') || 'CA'
  const zip         = searchParams.get('zip')
  const property_id = searchParams.get('property_id') // homeowner's property row id
  const force       = searchParams.get('force') === 'true'

  if (!address || !city || !zip) {
    return NextResponse.json({ error: 'Missing address parameters' }, { status: 400 })
  }

  const supabase        = await createClient()
  const serviceSupabase = createServiceClient()
  const now             = new Date()
  const cutoff          = new Date(now.getTime() - CACHE_DAYS * 86400000)

  // ── STEP 1: Check homeowner's properties table cache first ──
  if (property_id && !force) {
    const { data: prop } = await supabase
      .from('properties')
      .select('avm_value, avm_low, avm_high, avm_last_updated')
      .eq('id', property_id)
      .single()

    if (prop?.avm_value && prop?.avm_last_updated && new Date(prop.avm_last_updated) > cutoff) {
      return NextResponse.json({
        estimatedValue: prop.avm_value,
        lowValue:       prop.avm_low  || Math.round(prop.avm_value * 0.95),
        highValue:      prop.avm_high || Math.round(prop.avm_value * 1.05),
        cached:         true,
        source:         'dashboard_cache',
        lastUpdated:    prop.avm_last_updated,
        nextUpdate:     new Date(new Date(prop.avm_last_updated).getTime() + CACHE_DAYS * 86400000).toISOString(),
      })
    }
  }

  // ── STEP 2: Check property_profiles table (unified property DB) ──
  // Build a search pattern for the address
  if (!force) {
    const { data: profile } = await serviceSupabase
      .from('property_profiles')
      .select('estimated_value, avm_low, avm_high, building_data_fetched_at, redfin_url')
      .ilike('address', `%${address.split(' ').slice(0,2).join(' ')}%`)
      .eq('zip', zip)
      .not('estimated_value', 'is', null)
      .order('building_data_fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (profile?.estimated_value && profile?.building_data_fetched_at &&
        new Date(profile.building_data_fetched_at) > cutoff) {
      // Found in property_profiles — save to homeowner properties cache too
      const estimatedValue = profile.estimated_value
      const lowValue       = profile.avm_low  || Math.round(estimatedValue * 0.95)
      const highValue      = profile.avm_high || Math.round(estimatedValue * 1.05)

      if (property_id) {
        await supabase.from('properties').update({
          avm_value:        estimatedValue,
          avm_low:          lowValue,
          avm_high:         highValue,
          avm_last_updated: now.toISOString(),
        }).eq('id', property_id)
      }

      return NextResponse.json({
        estimatedValue,
        lowValue,
        highValue,
        cached:      true,
        source:      'property_profiles',
        lastUpdated: profile.building_data_fetched_at,
        nextUpdate:  new Date(new Date(profile.building_data_fetched_at).getTime() + CACHE_DAYS * 86400000).toISOString(),
      })
    }
  }

  // ── STEP 3: Cache miss — call Redfin API (last resort) ──
  try {
    const query     = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const acRes     = await fetch(`https://${HOST}/properties/auto-complete?query=${query}`, { headers: HEADERS })
    const acData    = await acRes.json()
    const firstResult = acData?.data?.[0]?.rows?.[0]
    if (!firstResult?.url) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    const redfinUrl  = `https://www.redfin.com${firstResult.url}`
    const urlPath    = firstResult.url

    // Fetch details + estimate in parallel
    const [detailData, mainInfo] = await Promise.all([
      fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(urlPath)}`, { headers: HEADERS }).then(r => r.json()),
      fetch(`https://${HOST}/properties/main-info?url=${encodeURIComponent(urlPath)}`, { headers: HEADERS }).then(r => r.json()),
    ])

    const avm          = detailData?.data?.avm
    const atf          = detailData?.data?.aboveTheFold?.addressSectionInfo
    const estimatedValue = avm?.predictedValue || atf?.avmInfo?.predictedValue || atf?.priceInfo?.amount || null

    if (!estimatedValue) return NextResponse.json({ error: 'No value estimate available' }, { status: 404 })

    const comparables = avm?.comparables || []
    const compPrices  = comparables.map(c => c.priceInfo?.amount).filter(Boolean)
    const lowValue    = avm?.predictedRangeLow  || (compPrices.length ? Math.min(...compPrices) : Math.round(estimatedValue * 0.95))
    const highValue   = avm?.predictedRangeHigh || (compPrices.length ? Math.max(...compPrices) : Math.round(estimatedValue * 1.05))
    const nowISO      = now.toISOString()

    // Save AVM to property_profiles (unified store)
    serviceSupabase.from('property_profiles').upsert({
      redfin_url:     redfinUrl,
      address, city, state, zip,
      full_address:   `${address}, ${city}, ${state} ${zip}`,
      estimated_value: estimatedValue,
      avm_low:         Math.round(lowValue),
      avm_high:        Math.round(highValue),
      building_data_fetched_at: nowISO,
      updated_at: nowISO,
    }, { onConflict: 'redfin_url' }).then(() => {}).catch(() => {})

    // Save to homeowner's properties cache
    if (property_id) {
      await supabase.from('properties').update({
        avm_value:        estimatedValue,
        avm_low:          Math.round(lowValue),
        avm_high:         Math.round(highValue),
        avm_last_updated: nowISO,
      }).eq('id', property_id)
    }

    return NextResponse.json({
      estimatedValue,
      lowValue:    Math.round(lowValue),
      highValue:   Math.round(highValue),
      cached:      false,
      source:      'redfin_api',
      lastUpdated: nowISO,
      nextUpdate:  new Date(now.getTime() + CACHE_DAYS * 86400000).toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
