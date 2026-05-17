import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConnectionsClient from './ConnectionsClient'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'homeowner') redirect('/dashboard')

  const { data: requests } = await supabase
    .from('relationships')
    .select(`
      id, status, message, created_at, professional_role,
      professional:professional_id (
        id, full_name, email, phone, company, avatar_url, license_number, website, bio
      )
    `)
    .eq('homeowner_id', user.id)
    .order('created_at', { ascending: false })

  return <ConnectionsClient requests={requests || []} />
}
