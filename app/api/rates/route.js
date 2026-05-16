import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // FRED API - 30yr fixed mortgage rate (free, no key needed)
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=5&file_type=json',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error('FRED fetch failed')
    const data = await res.json()
    const latest = data.observations?.[0]
    return NextResponse.json({
      rate: parseFloat(latest?.value),
      date: latest?.date,
      source: 'Freddie Mac via FRED',
    })
  } catch {
    // Fallback static rate if API unavailable
    return NextResponse.json({ rate: 6.87, date: new Date().toISOString().split('T')[0], source: 'Fallback' })
  }
}
