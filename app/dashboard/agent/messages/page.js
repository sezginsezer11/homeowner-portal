import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgentMessagesClient from './AgentMessagesClient'

export default async function AgentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'agent') redirect('/dashboard')

  // Sent messages
  const { data: sent } = await supabase
    .from('messages')
    .select('*, to:to_id(full_name, email)')
    .eq('from_id', user.id)
    .order('created_at', { ascending: false })

  // Connected clients for new message compose
  const { data: relationships } = await supabase
    .from('relationships')
    .select('homeowner:homeowner_id(id, full_name, email)')
    .eq('professional_id', user.id)

  const clients = (relationships || []).map(r => r.homeowner).filter(Boolean)

  return <AgentMessagesClient sentMessages={sent || []} clients={clients} />
}
