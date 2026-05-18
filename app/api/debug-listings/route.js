import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const results = {}

  // Test autocomplete to see exact response structure
  try {
    const r = await fetch(
      `https://${HOST}/properties/auto-complete?query=San+Diego+CA`,
      { headers: HEADERS }
    )
    results.autocomplete = await r.json()
  } catch(e) { results.autocomplete_error = e.message }

  // Test search-sale with different param formats
  try {
    const r = await fetch(
      `https://${HOST}/properties/search-sale?regionId=2295&regionType=6&limit=3`,
      { headers: HEADERS }
    )
    results.search_2295 = await r.json()
  } catch(e) { results.search_2295_error = e.message }

  return NextResponse.json(results)
}
