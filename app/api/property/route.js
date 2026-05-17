import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH — update property details
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { property_id, ...updates } = body
  if (!property_id) return NextResponse.json({ error: 'property_id required' }, { status: 400 })
  const { error } = await supabase.from('properties').update(updates)
    .eq('id', property_id).eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — remove property
export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { property_id } = await request.json()
  if (!property_id) return NextResponse.json({ error: 'property_id required' }, { status: 400 })
  const { error } = await supabase.from('properties').delete()
    .eq('id', property_id).eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
