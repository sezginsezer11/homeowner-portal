import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city    = searchParams.get('city')
  const state   = searchParams.get('state') || 'CA'
  const zip     = searchParams.get('zip')

  if (!address || !city || !zip) {
    return NextResponse.json({ error: 'Missing address parameters' }, { status: 400 })
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-rapidapi-host': 'redfin-com-data.p.rapidapi.com',
    'x-rapidapi-key': RAPIDAPI_KEY,
  }

  try {
    // Step 1: Auto-complete to get property URL
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

    // Step 2: Get property details using the URL
    const propertyUrl = encodeURIComponent(firstResult.url)
    const detailRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/details?url=${propertyUrl}`,
      { headers: HEADERS }
    )
    const detailData = await detailRes.json()

    // Extract the Redfin Estimate value
    const avm           = detailData?.data?.avm
    const aboveTheFold  = detailData?.data?.aboveTheFold?.addressSectionInfo
    const estimatedValue = avm?.predictedValue
      || aboveTheFold?.avmInfo?.predictedValue
      || aboveTheFold?.priceInfo?.amount
      || null

    if (!estimatedValue) {
      return NextResponse.json({ error: 'No value estimate available for this property' }, { status: 404 })
    }

    // Build value range from comparables if available
    const comparables = avm?.comparables || []
    const compPrices  = comparables.map(c => c.priceInfo?.amount).filter(Boolean)
    const lowValue    = compPrices.length ? Math.min(...compPrices) : estimatedValue * 0.95
    const highValue   = compPrices.length ? Math.max(...compPrices) : estimatedValue * 1.05

    return NextResponse.json({
      estimatedValue,
      lowValue:  Math.round(lowValue),
      highValue: Math.round(highValue),
      latitude:  aboveTheFold?.latLong?.latitude || null,
      longitude: aboveTheFold?.latLong?.longitude || null,
      source: 'Redfin',
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
