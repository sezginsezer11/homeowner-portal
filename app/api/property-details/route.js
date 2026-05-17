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
    const amenityGroups = d?.belowTheFold?.amenitiesInfo?.superGroups?.[0]?.amenityGroups?.[0]?.amenityEntries || []
    const getA = (name) => amenityGroups.find(a => a.amenityName === name)?.amenityValues?.[0]
    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family' }
    const history = d?.belowTheFold?.propertyHistoryInfo?.events || []
    const lastSale = history.find(e => e.historyEventType === 1)
    const estimatedValue = d?.avm?.predictedValue || aboveTheFold?.avmInfo?.predictedValue || aboveTheFold?.priceInfo?.amount || null

    return NextResponse.json({
      found:         true,
      propertyType:  propTypeMap[aboveTheFold?.propertyType] || 'Residential',
      beds:          getA('Beds')     ? parseInt(getA('Beds'))     : aboveTheFold?.beds     || null,
      baths:         getA('Baths')    ? parseFloat(getA('Baths'))  : aboveTheFold?.baths    || null,
      sqft:          getA('Sq. Ft.')  ? parseInt(getA('Sq. Ft.')?.replace(/,/g,'')) : null,
      yearBuilt:     getA('Year Built') ? parseInt(getA('Year Built')) : null,
      estimatedValue,
      lastSalePrice: lastSale?.price || null,
      lastSaleDate:  lastSale?.eventDateString || null,
    })
  } catch (err) {
    return NextResponse.json({ found: false, error: err.message })
  }
}
