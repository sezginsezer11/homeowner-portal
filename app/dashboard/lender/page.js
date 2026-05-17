import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LenderDashboardClient from './LenderDashboardClient'

export default async function LenderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'lender') redirect('/dashboard')

  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      *,
      homeowner:homeowner_id (
        id, full_name, email, phone,
        properties (id, address, city, state, zip, purchase_price, loan_balance, loan_rate, loan_type, sqft, bedrooms)
      )
    `)
    .eq('professional_id', user.id)
    .order('created_at', { ascending: false })

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, to:to_id(full_name)')
    .eq('from_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch current mortgage rate
  let currentRate = 6.87
  try {
    const rateRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://api.stlouisfed.org' : 'https://api.stlouisfed.org'}/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=1&file_type=json`)
    const rateData = await rateRes.json()
    currentRate = parseFloat(rateData.observations?.[0]?.value) || 6.87
  } catch {}

  return (
    <LenderDashboardClient
      profile={profile}
      relationships={relationships || []}
      recentMessages={recentMessages || []}
      currentRate={currentRate}
    />
  )
}
