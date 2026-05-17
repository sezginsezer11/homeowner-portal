import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HelocClient from './HelocClient'

export default async function HelocPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: properties } = await supabase
    .from('properties').select('*').eq('owner_id', user.id)
  return <HelocClient properties={properties || []} />
}
