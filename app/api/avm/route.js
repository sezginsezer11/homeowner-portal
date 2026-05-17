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
    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const url = `https://zllw-working-api.p.rapidapi.com/pro/byaddress?propertyaddress=${fullAddress}`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'zllw-working-api.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
      next: { revalidate: 86400 }
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Zillow API error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const zestimate = data?.zestimate?.amount || data?.price || null
    const lowValue  = data?.zestimate?.valuationRange?.low || null
    const highValue = data?.zestimate?.valuationRange?.high || null

    if (!zestimate) {
      return NextResponse.json({ error: 'No value estimate found for this address' }, { status: 404 })
    }

    return NextResponse.json({
      estimatedValue: zestimate,
      lowValue,
      highValue,
      latitude:  data?.latitude || null,
      longitude: data?.longitude || null,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
