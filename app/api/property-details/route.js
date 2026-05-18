import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city    = searchParams.get('city')
  const state   = searchParams.get('state') || 'CA'
  const zip     = searchParams.get('zip')
  const debug   = searchParams.get('debug') === 'true'

  if (!address || !city) return NextResponse.json({ error: 'Missing address' }, { status: 400 })

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

    // Flatten ALL amenity entries
    const allEntries = (d?.belowTheFold?.amenitiesInfo?.superGroups || [])
      .flatMap(sg => (sg?.amenityGroups || []).flatMap(ag => ag?.amenityEntries || []))

    const findVal = (...terms) => {
      for (const term of terms) {
        const found = allEntries.find(a => a?.amenityName?.toLowerCase().includes(term.toLowerCase()))
        if (found?.amenityValues?.[0]) return found.amenityValues[0]
      }
      return null
    }

    // Try public records first (most reliable for sqft/year)
    const pr = d?.belowTheFold?.publicRecordsInfo
    const prSqft      = pr?.sqFt || pr?.sqft || pr?.finishedSqFt || pr?.totalSqFt
    const prYearBuilt = pr?.yearBuilt || pr?.year_built
    const prBeds      = pr?.beds || pr?.bedrooms
    const prBaths     = pr?.baths || pr?.bathrooms

    // Then try amenities
    const sqftRaw     = prSqft      || findVal('Sq. Ft', 'Square Feet', 'sqft', 'Total Sq', 'Finished Sq', 'Living Area', 'Floor Area', 'Total Floor')
    const yearRaw     = prYearBuilt || findVal('Year Built', 'Built in', 'Built')
    const bedsRaw     = prBeds      || findVal('Beds', 'Bedrooms', 'Bed')
    const bathsRaw    = prBaths     || findVal('Baths', 'Bathrooms', 'Bath')

    // Also check MLS info
    const mlsInfo = d?.belowTheFold?.mlsInfo
    const mlsSqft = mlsInfo?.sqFt || mlsInfo?.sqft
    const mlsYear = mlsInfo?.yearBuilt

    const sqft      = sqftRaw ? parseInt(sqftRaw.toString().replace(/[^0-9]/g,'')) : (mlsSqft ? parseInt(mlsSqft) : null)
    const yearBuilt = yearRaw ? parseInt(yearRaw) : (mlsYear ? parseInt(mlsYear) : null)
    const beds      = bedsRaw  ? parseInt(bedsRaw)   : aboveTheFold?.beds  || null
    const baths     = bathsRaw ? parseFloat(bathsRaw) : aboveTheFold?.baths || null

    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }
    const history    = d?.belowTheFold?.propertyHistoryInfo?.events || []
    const lastSale   = history.find(e => e.historyEventType === 1 || e.eventDescription?.toLowerCase().includes('sold'))
    const estimatedValue = d?.avm?.predictedValue || aboveTheFold?.avmInfo?.predictedValue || aboveTheFold?.priceInfo?.amount || null

    const response = {
      found: true,
      propertyType: propTypeMap[aboveTheFold?.propertyType] || 'Residential',
      beds, baths, sqft, yearBuilt, estimatedValue,
      lastSalePrice: lastSale?.price || null,
      lastSaleDate:  lastSale?.eventDateString || null,
    }

    // Add debug info if requested
    if (debug) {
      response._allAmenityNames = allEntries.map(e => `${e?.amenityName}: ${e?.amenityValues?.join(',')}`).filter(Boolean)
      response._publicRecords   = pr
      response._mlsInfo         = mlsInfo
    }

    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json({ found: false, error: err.message })
  }
}
