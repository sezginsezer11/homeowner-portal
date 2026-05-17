import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabase.from('offer_requests').insert({
    homeowner_id:     user.id,
    property_id:      body.property_id || null,
    address:          body.address,
    city:             body.city,
    state:            body.state,
    zip:              body.zip,
    asking_price:     body.asking_price || null,
    home_condition:   body.home_condition,
    timeline:         body.timeline,
    cash_offers_only: body.cash_offers_only || false,
    notes:            body.notes || null,
    status:           'active',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('offer_requests')
    .select('*')
    .eq('homeowner_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ offers: data || [] })
}

export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()
  const { error } = await supabase.from('offer_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).eq('homeowner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
