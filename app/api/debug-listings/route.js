import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url  = searchParams.get('url') || 'https://www.redfin.com/CA/San-Diego/7687-Marker-Rd-92130/home/6483646'
  const path = url.replace('https://www.redfin.com', '')

  const results = {}

  // Get full details with path
  try {
    const r    = await fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(path)}`, { headers: HEADERS })
    const data = await r.json()
    const d    = data?.data
    const btf  = d?.belowTheFold
    const atf  = d?.aboveTheFold

    results.structure = {
      top_keys:          Object.keys(d || {}),
      btf_keys:          Object.keys(btf || {}),
      atf_keys:          Object.keys(atf || {}),
      photos_raw:        d?.photos,
      mediaBrowser:      btf?.mediaBrowserInfo ? Object.keys(btf.mediaBrowserInfo) : null,
      first_media:       btf?.mediaBrowserInfo?.photos?.[0],
      photoUrls:         btf?.mediaBrowserInfo?.photos?.[0]?.photoUrls,
      publicRemarks:     btf?.publicRemarks?.slice(0, 200),
      descriptionInfo:   btf?.descriptionInfo,
      listingRemarks:    btf?.listingRemarks,
      remarksAccessLevel: d?.remarksAccessLevel,
      atf_photos:        atf?.photos,
      numPhotos:         d?.numPhotos || btf?.numPhotos,
    }
  } catch(e) { results.error = e.message }

  // Get photos specifically
  try {
    const r    = await fetch(`https://${HOST}/properties/detail-by-url?url=${encodeURIComponent(path)}`, { headers: HEADERS })
    const data = await r.json()
    results.detail_by_url = {
      status: r.status,
      message: data?.message,
      has_photos: !!(data?.data?.photos),
      photos_sample: data?.data?.photos?.slice(0,2),
    }
  } catch(e) { results.detail_by_url_error = e.message }

  return NextResponse.json(results)
}
