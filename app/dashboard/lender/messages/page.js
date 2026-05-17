import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LenderMessagesClient from './LenderMessagesClient'

export default async function LenderMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'lender') redirect('/dashboard')

  const { data: sent } = await supabase
    .from('messages').select('*, to:to_id(full_name, email)')
    .eq('from_id', user.id).order('created_at', { ascending: false })

  const { data: relationships } = await supabase
    .from('relationships').select('homeowner:homeowner_id(id, full_name, email)')
    .eq('professional_id', user.id)

  const clients = (relationships || []).map(r => r.homeowner).filter(Boolean)

  let currentRate = 6.87
  try {
    const rateRes = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=e7b2e6b3a2a24e2c9c4b84ff7b2b4b4b&sort_order=desc&limit=1&file_type=json')
    const rateData = await rateRes.json()
    currentRate = parseFloat(rateData.observations?.[0]?.value) || 6.87
  } catch {}

  return <LenderMessagesClient sentMessages={sent || []} clients={clients} currentRate={currentRate} />
}
