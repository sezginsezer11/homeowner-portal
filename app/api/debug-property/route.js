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
  const atf  = d?.aboveTheFold
  const btf  = d?.belowTheFold
  const media = atf?.mediaBrowserInfo

  return NextResponse.json({
    // Photos location
    media_keys:        media ? Object.keys(media) : null,
    media_photos:      media?.photos?.slice(0,2),
    media_firstPhoto:  media?.photos?.[0],
    media_photoCount:  media?.photos?.length,
    // Description
    aiSummary:         d?.aiSummary?.slice(0,200),
    p1_keys:           d?.p1 ? Object.keys(d.p1) : null,
    listings_keys:     d?.listings ? Object.keys(d.listings) : null,
    onMarket:          d?.onMarket ? Object.keys(d.onMarket) : null,
    onMarket_remarks:  d?.onMarket?.remarks?.slice(0,200),
    onMarket_description: d?.onMarket?.description?.slice(0,200),
    // Address
    address_info:      atf?.addressSectionInfo ? Object.keys(atf.addressSectionInfo) : null,
  })
}
