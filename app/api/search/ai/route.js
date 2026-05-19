import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

function val(f) {
  if (f == null) return null
  if (typeof f === 'object') {
    if ('value' in f) return f.value ?? null
    return null
  }
  return f
}

function parseAddress(h) {
  const s = h?.streetLine
  if (!s) return ''
  if (typeof s === 'string') return s
  if (s?.value) return s.value
  if (s?.streetNumber) return [s.streetNumber, s.streetName, s.streetType, s.unitValue].filter(Boolean).join(' ')
  return ''
}

async function parseQueryWithAI(query) {
  try {
    const client = new Anthropic()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Extract search filters from this real estate search query. Return ONLY valid JSON with these fields (use null if not mentioned):
{
  "location": "city and state e.g. San Diego, CA",
  "minPrice": number or null,
  "maxPrice": number or null,
  "minBeds": number or null,
  "minBaths": number or null,
  "propType": "Single Family" | "Condo/Townhome" | "Townhome" | null,
  "keywords": ["pool", "garage", "view", etc] or []
}

Query: "${query}"

Return ONLY the JSON object, no other text.`
      }]
    })
    const text = msg.content[0].text.trim()
    return JSON.parse(text)
  } catch {
    return { location: 'San Diego, CA', minPrice: null, maxPrice: null, minBeds: null, minBaths: null, propType: null, keywords: [] }
  }
}

export async function POST(request) {
  const { query } = await request.json()
  if (!query) return NextResponse.json({ listings: [], error: 'No query provided' })

  // Parse natural language with Claude
  const filters = await parseQueryWithAI(query)
  const location = filters.location || 'San Diego, CA'

  try {
    const acRes = await fetch(
      `https://${HOST}/properties/auto-complete?query=${encodeURIComponent(location)}`,
      { headers: HEADERS }
    )
    const acData = await acRes.json()
    const placeRows = acData?.data?.[0]?.rows || []
    const region = placeRows.find(r => r.type === '2' || r.type === '5') || placeRows[0]
    if (!region) return NextResponse.json({ listings: [], filters, error: 'Location not found' })

    const regionUrl = `https://www.redfin.com${region.url}`
    const searchRes = await fetch(
      `https://${HOST}/properties/search-by-url?url=${encodeURIComponent(regionUrl)}&limit=50`,
      { headers: HEADERS }
    )
    const searchData = await searchRes.json()
    let homes = searchData?.data?.homes || []

    // Apply extracted filters
    homes = homes.filter(h => {
      const price = val(h?.price)
      const beds  = val(h?.beds)
      const baths = val(h?.baths)
      if (filters.minPrice && price && price < filters.minPrice) return false
      if (filters.maxPrice && price && price > filters.maxPrice) return false
      if (filters.minBeds && beds && beds < filters.minBeds) return false
      if (filters.minBaths && baths && baths < filters.minBaths) return false
      if (filters.propType && h?.propertyType) {
        const typeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome' }
        if (typeMap[h.propertyType] !== filters.propType) return false
      }
      // Keyword matching in listing remarks
      if (filters.keywords?.length > 0) {
        const remarks = (h?.listingRemarks || '').toLowerCase()
        const hasKeyword = filters.keywords.some(k => remarks.includes(k.toLowerCase()))
        if (!hasKeyword) return false
      }
      return true
    })

    const propTypeMap = { 3:'Condo/Townhome', 6:'Single Family', 13:'Townhome', 4:'Multi-Family', 8:'Land' }

    const listings = homes.slice(0, 12).map(h => ({
      address:         parseAddress(h),
      city:            h?.city || '',
      state:           h?.state || 'CA',
      zip:             val(h?.zip) || val(h?.postalCode) || '',
      price:           val(h?.price),
      beds:            val(h?.beds),
      baths:           val(h?.baths),
      sqft:            val(h?.sqFt),
      year_built:      val(h?.yearBuilt),
      property_type:   propTypeMap[h?.propertyType] || 'Residential',
      photo:           h?.photos?.items?.[0] || null,
      photos:          h?.photos?.items?.slice(0,10) || [],
      status:          h?.mlsStatus || 'Active',
      days_on_market:  val(h?.dom),
      price_reduced:   h?.isHot || false,
      is_new_construction: h?.isNewConstruction || false,
      open_house:      h?.openHouseStartFormatted || null,
      has_3d_tour:     h?.has3DTour || false,
      has_virtual_tour: h?.hasVirtualTour || false,
      price_per_sqft:  val(h?.pricePerSqFt),
      lot_size:        val(h?.lotSize),
      url:             h?.url,
      listing_id:      h?.listingId,
      listing_remarks: h?.listingRemarks || null,
    }))

    return NextResponse.json({ listings, total: listings.length, filters, region: region.name })
  } catch (err) {
    return NextResponse.json({ listings: [], error: err.message, filters })
  }
}
