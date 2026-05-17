import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MortgageClient from './MortgageClient'

export default async function MortgagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get current rate
  let currentRate = 6.87
  try {
    const res = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=5&file_type=json')
    const data = await res.json()
    const rates = data.observations || []
    currentRate = parseFloat(rates[0]?.value) || 6.87
  } catch {}

  // Get user's properties for refi calc
  const { data: properties } = await supabase
    .from('properties')
    .select('id, address, city, loan_balance, loan_rate, loan_type, purchase_price')
    .eq('owner_id', user.id)

  return <MortgageClient currentRate={currentRate} properties={properties || []} />
}
