import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgentClientsClient from './AgentClientsClient'

export default async function AgentClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'agent') redirect('/dashboard')

  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      id,
      created_at,
      homeowner:homeowner_id (
        id, full_name, email, phone,
        properties (id, address, city, state, zip, purchase_price, loan_balance, loan_rate, bedrooms, bathrooms, sqft)
      )
    `)
    .eq('professional_id', user.id)
    .order('created_at', { ascending: false })

  return <AgentClientsClient relationships={relationships || []} />
}
