import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const results = {}

  const tests = [
    'properties/search-sale?regionId=16904&regionType=6&limit=3',
    'properties/search-sale?regionId=16904&regionType=2&limit=3',
    'properties/search-sale?regionId=16904&regionType=6&limit=3&sort=1',
    'properties/search-sale?regionId=16904&regionType=6&num=3',
    'properties/search-sale?region_id=16904&region_type=6&limit=3',
  ]

  for (let i = 0; i < tests.length; i++) {
    try {
      const r = await fetch(`https://${HOST}/${tests[i]}`, { headers: HEADERS })
      const data = await r.json()
      results[`test${i+1}`] = {
        url: tests[i],
        status: r.status,
        keys: Object.keys(data?.data || {}),
        errors: data?.errors,
        homes_count: data?.data?.homes?.length || 0,
        message: data?.message,
      }
    } catch(e) { results[`test${i+1}_error`] = e.message }
  }

  return NextResponse.json(results)
}
