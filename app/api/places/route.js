import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  if (!query) return NextResponse.json({ suggestions: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    // Fallback: return empty if no key configured yet
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:us&key=${apiKey}`
    const res  = await fetch(url)
    const data = await res.json()

    const suggestions = await Promise.all(
      (data.predictions || []).slice(0, 5).map(async (p) => {
        // Get place details for structured address
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=address_components,formatted_address&key=${apiKey}`
        const detailRes  = await fetch(detailUrl)
        const detail     = await detailRes.json()
        const comps      = detail.result?.address_components || []

        const get = (type) => comps.find(c => c.types.includes(type))?.long_name || ''
        const getS = (type) => comps.find(c => c.types.includes(type))?.short_name || ''

        const streetNum = get('street_number')
        const route     = get('route')
        const city      = get('locality') || get('sublocality') || get('neighborhood')
        const state     = getS('administrative_area_level_1')
        const zip       = get('postal_code')

        return {
          address: [streetNum, route].filter(Boolean).join(' '),
          city,
          state,
          zip,
          full: detail.result?.formatted_address || p.description,
        }
      })
    )

    return NextResponse.json({ suggestions })
  } catch (err) {
    return NextResponse.json({ suggestions: [], error: err.message })
  }
}
