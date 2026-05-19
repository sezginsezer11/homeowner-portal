import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url') || 'https://www.redfin.com/CA/San-Diego/7687-Marker-Rd-92130/home/6483646'
  const path = url.replace('https://www.redfin.com', '')
  const results = {}

  // Test full URL
  try {
    const r = await fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(url)}`, { headers: HEADERS })
    const data = await r.json()
    results.full_url = {
      status: r.status,
      message: data?.message,
      photo_count: data?.data?.photos?.length || 0,
      first_photo: data?.data?.photos?.[0],
      avm: data?.data?.avm?.predictedValue,
      remarks: data?.data?.belowTheFold?.publicRemarks?.slice(0,150),
      top_keys: Object.keys(data?.data || {}),
    }
  } catch(e) { results.full_url_error = e.message }

  // Test path only
  try {
    const r = await fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(path)}`, { headers: HEADERS })
    const data = await r.json()
    results.path_only = {
      status: r.status,
      message: data?.message,
      photo_count: data?.data?.photos?.length || 0,
      first_photo: data?.data?.photos?.[0],
      avm: data?.data?.avm?.predictedValue,
      remarks: data?.data?.belowTheFold?.publicRemarks?.slice(0,150),
    }
  } catch(e) { results.path_only_error = e.message }

  return NextResponse.json(results)
}
