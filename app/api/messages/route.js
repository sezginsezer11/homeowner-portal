import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — send a message to one or multiple recipients
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to_ids, subject, body, message_type, property_id } = await request.json()

  if (!to_ids?.length || !body) {
    return NextResponse.json({ error: 'Recipients and message body required' }, { status: 400 })
  }

  const rows = to_ids.map(to_id => ({
    from_id: user.id,
    to_id,
    subject: subject || null,
    body,
    message_type: message_type || 'general',
    property_id: property_id || null,
  }))

  const { error } = await supabase.from('messages').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, sent: rows.length })
}
