import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const results = {}

  const tests = [
    { name: 'search-by-url San Diego', url: 'properties/search-by-url?url=https%3A%2F%2Fwww.redfin.com%2Fcity%2F16904%2FCA%2FSan-Diego&limit=3' },
    { name: 'search-by-url Carmel Valley', url: 'properties/search-by-url?url=https%3A%2F%2Fwww.redfin.com%2Fneighborhood%2F3873%2FCA%2FSan-Diego%2FCarmel-Valley&limit=3' },
    { name: 'search-by-url 92130 zip', url: 'properties/search-by-url?url=https%3A%2F%2Fwww.redfin.com%2Fzipcode%2F92130&limit=3' },
  ]

  for (const test of tests) {
    try {
      const r = await fetch(`https://${HOST}/${test.url}`, { headers: HEADERS })
      const data = await r.json()
      results[test.name] = {
        status: r.status,
        message: data?.message,
        errors: data?.errors,
        homes_count: data?.data?.homes?.length || 0,
        keys: Object.keys(data?.data || {}),
        sample: data?.data?.homes?.[0] ? {
          address: data.data.homes[0].streetLine,
          price: data.data.homes[0].price,
          beds: data.data.homes[0].beds,
          sqft: data.data.homes[0].sqFt,
        } : null
      }
    } catch(e) { results[test.name] = { error: e.message } }
  }

  return NextResponse.json(results)
}
