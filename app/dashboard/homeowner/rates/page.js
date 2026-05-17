import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShopRatesClient from './ShopRatesClient'

export default async function ShopRatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let currentRate = 6.87
  try {
    const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=1&file_type=json`, { next: { revalidate: 86400 } })
    const data = await res.json()
    currentRate = parseFloat(data.observations?.[0]?.value) || 6.87
  } catch {}

  return <ShopRatesClient currentRate={currentRate} />
}
