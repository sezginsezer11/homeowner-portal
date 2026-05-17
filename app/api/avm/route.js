import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CACHE_DAYS = 14

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address     = searchParams.get('address')
  const city        = searchParams.get('city')
  const state       = searchParams.get('state') || 'CA'
  const zip         = searchParams.get('zip')
  const property_id = searchParams.get('property_id')
  const force       = searchParams.get('force') === 'true'

  if (!address || !city || !zip) {
    return NextResponse.json({ error: 'Missing address parameters' }, { status: 400 })
  }

  const supabase = await createClient()

  // ALWAYS check cache first — regardless of property_id
  if (property_id && !force) {
    const { data: prop } = await supabase
      .from('properties')
      .select('avm_value, avm_low, avm_high, avm_last_updated')
      .eq('id', property_id)
      .single()

    if (prop?.avm_value && prop?.avm_last_updated) {
      const daysSince = (Date.now() - new Date(prop.avm_last_updated).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < CACHE_DAYS) {
        // Return cached — ZERO API calls used
        return NextResponse.json({
          estimatedValue: prop.avm_value,
          lowValue:       prop.avm_low  || Math.round(prop.avm_value * 0.95),
          highValue:      prop.avm_high || Math.round(prop.avm_value * 1.05),
          cached:         true,
          lastUpdated:    prop.avm_last_updated,
          nextUpdate:     new Date(new Date(prop.avm_last_updated).getTime() + CACHE_DAYS * 86400000).toISOString(),
        })
      }
    }
  }

  // Cache miss or force refresh — call Redfin API
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-rapidapi-host': 'redfin-com-data.p.rapidapi.com',
    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
  }

  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const searchRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/auto-complete?query=${query}`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const firstResult = searchData?.data?.[0]?.rows?.[0]
    if (!firstResult?.url) {
      return NextResponse.json({ error: 'Property not found for this address' }, { status: 404 })
    }

    const detailRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/details?url=${encodeURIComponent(firstResult.url)}`,
      { headers: HEADERS }
    )
    const detailData = await detailRes.json()
    const avm          = detailData?.data?.avm
    const aboveTheFold = detailData?.data?.aboveTheFold?.addressSectionInfo
    const estimatedValue = avm?.predictedValue
      || aboveTheFold?.avmInfo?.predictedValue
      || aboveTheFold?.priceInfo?.amount
      || null

    if (!estimatedValue) {
      return NextResponse.json({ error: 'No value estimate available' }, { status: 404 })
    }

    const comparables = avm?.comparables || []
    const compPrices  = comparables.map(c => c.priceInfo?.amount).filter(Boolean)
    const lowValue    = compPrices.length ? Math.min(...compPrices) : Math.round(estimatedValue * 0.95)
    const highValue   = compPrices.length ? Math.max(...compPrices) : Math.round(estimatedValue * 1.05)
    const now         = new Date().toISOString()

    // Save to cache — works for ALL properties
    if (property_id) {
      const { error: updateError } = await supabase.from('properties').update({
        avm_value:        estimatedValue,
        avm_low:          Math.round(lowValue),
        avm_high:         Math.round(highValue),
        avm_last_updated: now,
      }).eq('id', property_id)
      if (updateError) console.error('Cache save error:', updateError.message)
    }

    return NextResponse.json({
      estimatedValue,
      lowValue:    Math.round(lowValue),
      highValue:   Math.round(highValue),
      cached:      false,
      lastUpdated: now,
      nextUpdate:  new Date(Date.now() + CACHE_DAYS * 86400000).toISOString(),
      source:      'Redfin',
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
