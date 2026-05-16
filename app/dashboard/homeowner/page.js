import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeownerDashboardClient from './HomeownerDashboardClient'

export default async function HomeownerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'homeowner') redirect('/dashboard')

  const { data: properties } = await supabase
    .from('properties').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })

  const { data: messages } = await supabase
    .from('messages').select('*, from:from_id(full_name, role)')
    .eq('to_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5)

  const { data: relationships } = await supabase
    .from('relationships')
    .select('*, professional:professional_id(full_name, role, email, phone, company)')
    .eq('homeowner_id', user.id)

  return (
    <HomeownerDashboardClient
      profile={profile}
      properties={properties || []}
      unreadMessages={messages || []}
      relationships={relationships || []}
    />
  )
}
