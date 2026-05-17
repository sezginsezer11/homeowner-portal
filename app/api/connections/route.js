import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — send a connection request
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, message } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const { data: professional } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!professional || (professional.role !== 'agent' && professional.role !== 'lender')) {
    return NextResponse.json({ error: 'Only agents and lenders can send requests' }, { status: 403 })
  }

  // Find homeowner — only by email, cannot browse
  const { data: homeowner } = await supabase
    .from('profiles').select('id, full_name, role').eq('email', email).single()

  if (!homeowner) return NextResponse.json({ error: 'No account found with that email address' }, { status: 404 })
  if (homeowner.role !== 'homeowner') return NextResponse.json({ error: 'That user is not a homeowner' }, { status: 400 })
  if (homeowner.id === user.id) return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })

  // Check for existing request
  const { data: existing } = await supabase
    .from('relationships')
    .select('id, status').eq('homeowner_id', homeowner.id).eq('professional_id', user.id).single()

  if (existing) {
    if (existing.status === 'accepted') return NextResponse.json({ error: 'Already connected' }, { status: 409 })
    if (existing.status === 'pending')  return NextResponse.json({ error: 'Request already sent — waiting for approval' }, { status: 409 })
    if (existing.status === 'declined') {
      // Allow resending after decline
      await supabase.from('relationships').update({ status: 'pending', message, updated_at: new Date().toISOString() }).eq('id', existing.id)
      return NextResponse.json({ success: true, homeowner: { id: homeowner.id, full_name: homeowner.full_name }, resent: true })
    }
  }

  const { error } = await supabase.from('relationships').insert({
    homeowner_id:      homeowner.id,
    professional_id:   user.id,
    professional_role: professional.role,
    status:            'pending',
    message:           message || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, homeowner: { id: homeowner.id, full_name: homeowner.full_name } })
}

// PATCH — accept or decline a request (homeowner only)
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { relationship_id, action } = await request.json()
  if (!['accepted', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await supabase.from('relationships')
    .update({ status: action, updated_at: new Date().toISOString() })
    .eq('id', relationship_id)
    .eq('homeowner_id', user.id) // Only homeowner can accept/decline

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — remove a connection
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { relationship_id } = await request.json()
  const { error } = await supabase.from('relationships')
    .delete()
    .eq('id', relationship_id)
    .or(`homeowner_id.eq.${user.id},professional_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
