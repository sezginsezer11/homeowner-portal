import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/CA/San-Diego/7687-Marker-Rd-92130/home/6483646'

  const r    = await fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(path)}`, { headers: HEADERS })
  const data = await r.json()
  const d    = data?.data
  const btf  = d?.belowTheFold
  const atf  = d?.aboveTheFold

  return NextResponse.json({
    all_top_keys: Object.keys(d || {}),
    btf_keys: Object.keys(btf || {}),
    atf_keys: Object.keys(atf || {}),
    // Check every possible photo location
    d_photos: d?.photos,
    d_photoCount: d?.numPhotos,
    btf_media: btf?.mediaBrowserInfo ? Object.keys(btf.mediaBrowserInfo) : null,
    btf_photos: btf?.photos,
    btf_media_photos: btf?.mediaBrowserInfo?.photos?.slice(0,2),
    atf_photos: atf?.photos,
    atf_addressSection_photos: atf?.addressSectionInfo?.photos,
    // Description
    btf_publicRemarks: btf?.publicRemarks?.slice(0,200),
    btf_description: btf?.descriptionInfo,
    atf_description: atf?.description,
  })
}
