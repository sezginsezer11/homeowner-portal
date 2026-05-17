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

    // Flatten ALL amenity entries from all superGroups and amenityGroups
    const allEntries = (d?.belowTheFold?.amenitiesInfo?.superGroups || [])
      .flatMap(sg => (sg?.amenityGroups || []).flatMap(ag => ag?.amenityEntries || []))

    // Search by partial name match, case insensitive
    const findAmenity = (...terms) => {
      for (const term of terms) {
        const found = allEntries.find(a =>
          a?.amenityName?.toLowerCase().includes(term.toLowerCase())
        )
        const val = found?.amenityValues?.[0]
        if (val) return val
      }
      return null
    }

    // Also check belowTheFold directly
    const publicRecords = d?.belowTheFold?.publicRecordsInfo
    const prSqft     = publicRecords?.sqFt || publicRecords?.sqft || publicRecords?.squareFeet
    const prYearBuilt = publicRecords?.yearBuilt || publicRecords?.year_built
    const prBeds     = publicRecords?.beds || publicRecords?.bedrooms
    const prBaths    = publicRecords?.baths || publicRecords?.bathrooms

    // Try multiple field paths
    const sqftRaw     = findAmenity('Sq. Ft', 'Square Feet', 'sqft', 'sq ft', 'Total Sq', 'Living Area', 'Floor Area')
    const yearRaw     = findAmenity('Year Built', 'Built in', 'Year of Construction', 'Built')
    const bedsRaw     = findAmenity('Beds', 'Bedrooms', 'Bed')
    const bathsRaw    = findAmenity('Baths', 'Bathrooms', 'Bath')

    const sqft      = sqftRaw ? parseInt(sqftRaw.toString().replace(/[^0-9]/g,'')) : (prSqft ? parseInt(prSqft) : null)
    const yearBuilt = yearRaw ? parseInt(yearRaw) : (prYearBuilt ? parseInt(prYearBuilt) : null)
    const beds      = bedsRaw ? parseInt(bedsRaw) : (prBeds ? parseInt(prBeds) : aboveTheFold?.beds || null)
    const baths     = bathsRaw ? parseFloat(bathsRaw) : (prBaths ? parseFloat(prBaths) : aboveTheFold?.baths || null)

    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }
    const history = d?.belowTheFold?.propertyHistoryInfo?.events || []
    const lastSale = history.find(e => e.historyEventType === 1 || e.eventDescription?.toLowerCase().includes('sold'))
    const estimatedValue = d?.avm?.predictedValue
      || aboveTheFold?.avmInfo?.predictedValue
      || aboveTheFold?.priceInfo?.amount || null

    // Log all amenity names for debugging
    const amenityNames = allEntries.map(e => e?.amenityName).filter(Boolean)

    return NextResponse.json({
      found:          true,
      propertyType:   propTypeMap[aboveTheFold?.propertyType] || 'Residential',
      beds, baths, sqft, yearBuilt, estimatedValue,
      lastSalePrice:  lastSale?.price || null,
      lastSaleDate:   lastSale?.eventDateString || null,
      // Debug info
      _amenityNames:  amenityNames,
      _publicRecords: publicRecords,
    })
  } catch (err) {
    return NextResponse.json({ found: false, error: err.message })
  }
}
