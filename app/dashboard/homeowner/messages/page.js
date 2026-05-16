import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, from:from_id(full_name, role, company)')
    .eq('to_id', user.id)
    .order('created_at', { ascending: false })

  // Mark all as read
  await supabase.from('messages').update({ read: true }).eq('to_id', user.id).eq('read', false)

  return <MessagesClient messages={messages || []} />
}
