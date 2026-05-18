import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const r = await fetch(
    `https://${HOST}/properties/search-by-url?url=${encodeURIComponent('https://www.redfin.com/city/16904/CA/San-Diego')}&limit=1`,
    { headers: HEADERS }
  )
  const data = await r.json()
  const home = data?.data?.homes?.[0]
  return NextResponse.json({
    all_keys: home ? Object.keys(home) : [],
    photo_related: home ? Object.fromEntries(
      Object.entries(home).filter(([k]) => k.toLowerCase().includes('photo') || k.toLowerCase().includes('image') || k.toLowerCase().includes('media') || k.toLowerCase().includes('img'))
    ) : {},
    full_home: home,
  })
}
