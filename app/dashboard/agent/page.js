import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgentDashboardClient from './AgentDashboardClient'

export default async function AgentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'agent') redirect('/dashboard')

  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      id, status,
      homeowner:homeowner_id (
        id, full_name, email, phone,
        properties (id, address, city, state, zip, purchase_price, loan_balance, loan_rate, avm_value, bedrooms, sqft)
      )
    `)
    .eq('professional_id', user.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, to:to_id(full_name)')
    .eq('from_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Extract clients from accepted relationships
  const clients = (relationships || [])
    .map(r => r.homeowner)
    .filter(Boolean)

  return (
    <AgentDashboardClient
      profile={profile}
      clients={clients}
      messages={recentMessages || []}
    />
  )
}
