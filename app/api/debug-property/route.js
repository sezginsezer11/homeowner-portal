import { NextResponse } from 'next/server'

const HOST = 'redfin-com-data.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': HOST,
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
}

export async function GET() {
  const path = '/CA/San-Diego/7687-Marker-Rd-92130/home/6483646'
  
  try {
    const r    = await fetch(`https://${HOST}/properties/details?url=${encodeURIComponent(path)}`, { headers: HEADERS })
    const data = await r.json()
    const d    = data?.data
    const atf  = d?.aboveTheFold
    const media = atf?.mediaBrowserInfo
    const photos = (media?.photos || []).flatMap(p => {
      if (typeof p === 'string') return [p]
      if (p?.photoUrls) return Object.values(p.photoUrls).filter(u => typeof u === 'string').slice(0,1)
      return []
    }).slice(0,3)

    return NextResponse.json({
      status: r.status,
      photo_count: media?.photos?.length || 0,
      sample_photos: photos,
      remarks: d?.onMarket?.remarks?.slice(0,200),
      avm: d?.avm?.predictedValue,
    })
  } catch(e) {
    return NextResponse.json({ error: e.message })
  }
}
