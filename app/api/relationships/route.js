import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — add a homeowner by email
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Get professional's role
  const { data: professional } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!professional || (professional.role !== 'agent' && professional.role !== 'lender')) {
    return NextResponse.json({ error: 'Only agents and lenders can add clients' }, { status: 403 })
  }

  // Find homeowner by email
  const { data: homeowner } = await supabase
    .from('profiles').select('id, full_name, role').eq('email', email).single()

  if (!homeowner) return NextResponse.json({ error: 'No user found with that email address' }, { status: 404 })
  if (homeowner.role !== 'homeowner') return NextResponse.json({ error: 'That user is not a homeowner' }, { status: 400 })
  if (homeowner.id === user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  // Check already connected
  const { data: existing } = await supabase
    .from('relationships')
    .select('id').eq('homeowner_id', homeowner.id).eq('professional_id', user.id).single()

  if (existing) return NextResponse.json({ error: 'Already connected to this homeowner' }, { status: 409 })

  // Create relationship
  const { error } = await supabase.from('relationships').insert({
    homeowner_id: homeowner.id,
    professional_id: user.id,
    professional_role: professional.role,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, homeowner: { id: homeowner.id, full_name: homeowner.full_name } })
}

// DELETE — remove a client
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { homeowner_id } = await request.json()
  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('homeowner_id', homeowner_id)
    .eq('professional_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
