import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const results = {}

  const tests = [
    'properties/search-sale?regionId=16904&regionType=2&limit=3',
    'properties/search-sale?regionId=16904&regionType=6&limit=3',
    'properties/search-sale?regionId=339&regionType=5&limit=3',
    'properties/search-sale?regionId=16904&regionType=2&limit=3&sort=1&soldWithin=',
    'properties/search-sale?regionId=16904&regionType=2&num_homes=3',
  ]

  for (let i = 0; i < tests.length; i++) {
    try {
      const r = await fetch(`https://${HOST}/${tests[i]}`, { headers: HEADERS })
      const data = await r.json()
      results[`test${i+1}`] = {
        url: tests[i],
        status: r.status,
        message: data?.message,
        errors: data?.errors,
        data_keys: Object.keys(data?.data || {}),
        homes_count: data?.data?.homes?.length || 0,
        sample: data?.data?.homes?.[0] ? {
          address: data.data.homes[0].streetLine,
          price: data.data.homes[0].price,
          beds: data.data.homes[0].beds,
        } : null
      }
    } catch(e) { results[`test${i+1}_error`] = e.message }
  }

  return NextResponse.json(results)
}
