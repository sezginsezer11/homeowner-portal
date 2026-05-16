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

  // All connected homeowners with their properties
  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      *,
      homeowner:homeowner_id (
        id, full_name, email, phone,
        properties (id, address, city, state, zip, purchase_price, loan_balance, loan_rate, bedrooms, sqft)
      )
    `)
    .eq('professional_id', user.id)
    .order('created_at', { ascending: false })

  // Recent sent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, to:to_id(full_name)')
    .eq('from_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AgentDashboardClient
      profile={profile}
      relationships={relationships || []}
      recentMessages={recentMessages || []}
    />
  )
}
