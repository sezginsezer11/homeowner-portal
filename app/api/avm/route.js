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

  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const url = `https://api.rentcast.io/v1/avm/value?address=${query}`

    const res = await fetch(url, {
      headers: {
        'X-Api-Key': process.env.RENTCAST_API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 } // cache 24 hours
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Rentcast error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      estimatedValue: data.price,
      lowValue:       data.priceRangeLow,
      highValue:      data.priceRangeHigh,
      latitude:       data.latitude,
      longitude:      data.longitude,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
