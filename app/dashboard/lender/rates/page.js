import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'

export default async function RatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'lender') redirect('/dashboard')

  const { data: relationships } = await supabase
    .from('relationships')
    .select(`homeowner:homeowner_id(id, full_name, email, properties(loan_rate, loan_balance, purchase_price, address))`)
    .eq('professional_id', user.id)

  const clients = (relationships || []).map(r => r.homeowner).filter(Boolean)

  // Fetch rate history (last 10 weeks)
  let rateHistory = []
  let currentRate = 6.87
  try {
    const res = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=10&file_type=json')
    const data = await res.json()
    rateHistory = (data.observations || []).reverse().map(o => ({
      date: new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: parseFloat(o.value),
    }))
    currentRate = rateHistory[rateHistory.length - 1]?.rate || 6.87
  } catch {}

  return <RatesClient clients={clients} rateHistory={rateHistory} currentRate={currentRate} />
}
