import { NextResponse } from 'next/server'

const RAPIDAPI_HOST = 'realtor-search.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const results = {}

  try {
    const r1 = await fetch(
      `https://${RAPIDAPI_HOST}/properties/search-buy?location=San-Diego_CA&limit=3`,
      { headers: HEADERS }
    )
    results.test1_status = r1.status
    results.test1_raw = await r1.json()
  } catch(e) { results.test1_error = e.message }

  try {
    const r2 = await fetch(
      `https://${RAPIDAPI_HOST}/properties/search-buy?city=San+Diego&state_code=CA&limit=3&sort=relevant`,
      { headers: HEADERS }
    )
    results.test2_status = r2.status
    results.test2_raw = await r2.json()
  } catch(e) { results.test2_error = e.message }

  return NextResponse.json(results)
}
