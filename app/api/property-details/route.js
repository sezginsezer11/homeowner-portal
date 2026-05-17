import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city    = searchParams.get('city')
  const state   = searchParams.get('state') || 'CA'
  const zip     = searchParams.get('zip')

  if (!address || !city) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  }

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
    if (!firstResult?.url) return NextResponse.json({ found: false })

    const detailRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/details?url=${encodeURIComponent(firstResult.url)}`,
      { headers: HEADERS }
    )
    const detail = await detailRes.json()
    const d = detail?.data
    const aboveTheFold = d?.aboveTheFold?.addressSectionInfo

    // Try all possible amenity group structures
    const allGroups = d?.belowTheFold?.amenitiesInfo?.superGroups?.flatMap(sg =>
      sg?.amenityGroups?.flatMap(ag => ag?.amenityEntries || []) || []
    ) || []

    // Helper to find amenity value by multiple possible names
    const getA = (...names) => {
      for (const name of names) {
        const found = allGroups.find(a =>
          a.amenityName?.toLowerCase().includes(name.toLowerCase())
        )
        if (found?.amenityValues?.[0]) return found.amenityValues[0]
      }
      return null
    }

    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family' }
    const history = d?.belowTheFold?.propertyHistoryInfo?.events || []
    const lastSale = history.find(e => e.historyEventType === 1)
    const estimatedValue = d?.avm?.predictedValue
      || aboveTheFold?.avmInfo?.predictedValue
      || aboveTheFold?.priceInfo?.amount
      || null

    // Sq ft — try multiple field paths
    const sqftRaw = getA('Sq. Ft.', 'Square Feet', 'sqft', 'sq ft', 'Total Sq')
    const sqft = sqftRaw ? parseInt(sqftRaw.toString().replace(/,/g,'')) : null

    // Year built — try multiple field paths
    const yearRaw = getA('Year Built', 'Built', 'Year')
    const yearBuilt = yearRaw ? parseInt(yearRaw) : null

    // Beds/baths
    const bedsRaw  = getA('Beds', 'Bedrooms', 'Bed')
    const bathsRaw = getA('Baths', 'Bathrooms', 'Bath')
    const beds  = bedsRaw  ? parseInt(bedsRaw)   : aboveTheFold?.beds  || null
    const baths = bathsRaw ? parseFloat(bathsRaw) : aboveTheFold?.baths || null

    // Log what we found to help debug
    console.log('Amenity keys found:', allGroups.map(g => g.amenityName).filter(Boolean))

    return NextResponse.json({
      found:         true,
      propertyType:  propTypeMap[aboveTheFold?.propertyType] || 'Residential',
      beds,
      baths,
      sqft,
      yearBuilt,
      estimatedValue,
      lastSalePrice: lastSale?.price || null,
      lastSaleDate:  lastSale?.eventDateString || null,
    })
  } catch (err) {
    return NextResponse.json({ found: false, error: err.message })
  }
}
