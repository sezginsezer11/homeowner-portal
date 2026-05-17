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
    // Step 1: autocomplete to get URL
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const searchRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/auto-complete?query=${query}`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    const firstResult = searchData?.data?.[0]?.rows?.[0]
    if (!firstResult?.url) return NextResponse.json({ found: false })

    // Step 2: get property details
    const detailRes = await fetch(
      `https://redfin-com-data.p.rapidapi.com/properties/details?url=${encodeURIComponent(firstResult.url)}`,
      { headers: HEADERS }
    )
    const detail = await detailRes.json()
    const d = detail?.data

    // Extract amenities
    const amenities = d?.belowTheFold?.amenitiesInfo?.amenitiesDisplayLevel
    const amenityGroups = d?.belowTheFold?.amenitiesInfo?.superGroups?.[0]?.amenityGroups?.[0]?.amenityEntries || []

    const getAmenity = (name) => amenityGroups.find(a => a.amenityName === name)?.amenityValues?.[0]

    // Property type mapping
    const propTypeMap = {
      3: 'Condo/Townhome', 6: 'Single Family', 13: 'Townhome',
      4: 'Multi-Family', 5: 'Multi-Family', 1: 'Land',
    }
    const propertyType = propTypeMap[d?.aboveTheFold?.addressSectionInfo?.propertyType] || 'Residential'

    // Last sale info from property history
    const history = d?.belowTheFold?.propertyHistoryInfo?.events || []
    const lastSale = history.find(e => e.historyEventType === 1 || e.eventDescription?.toLowerCase().includes('sold'))

    // AVM value
    const estimatedValue = d?.avm?.predictedValue
      || d?.aboveTheFold?.addressSectionInfo?.avmInfo?.predictedValue
      || null

    // Beds/baths from listings nearby or amenities
    const beds  = getAmenity('Beds')  || d?.aboveTheFold?.addressSectionInfo?.beds  || null
    const baths = getAmenity('Baths') || d?.aboveTheFold?.addressSectionInfo?.baths || null
    const sqft  = getAmenity('Sq. Ft.') || null
    const yearBuilt = getAmenity('Year Built') || null

    return NextResponse.json({
      found:          true,
      address:        d?.aboveTheFold?.addressSectionInfo?.streetAddress?.assembledAddress || address,
      city:           d?.aboveTheFold?.addressSectionInfo?.city || city,
      state:          d?.aboveTheFold?.addressSectionInfo?.state || state,
      zip:            d?.aboveTheFold?.addressSectionInfo?.zip || zip,
      propertyType,
      beds:           beds ? parseInt(beds) : null,
      baths:          baths ? parseFloat(baths) : null,
      sqft:           sqft ? parseInt(sqft.replace(/,/g,'')) : null,
      yearBuilt:      yearBuilt ? parseInt(yearBuilt) : null,
      estimatedValue,
      lastSalePrice:  lastSale?.price || null,
      lastSaleDate:   lastSale?.eventDateString || null,
      latitude:       d?.aboveTheFold?.addressSectionInfo?.latLong?.latitude || null,
      longitude:      d?.aboveTheFold?.addressSectionInfo?.latLong?.longitude || null,
    })
  } catch (err) {
    return NextResponse.json({ found: false, error: err.message })
  }
}
