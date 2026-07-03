// app/api/email/campaigns/[id]/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = [
    'name', 'subject', 'preheader', 'from_name', 'from_email', 'reply_to',
    'html_body', 'segment', 'domain_pool_tag', 'domain_ids', 'rotation_strategy',
  ];

  // Only drafts are editable
  const { data: existing } = await supabase
    .from('email_campaigns')
    .select('status')
    .eq('user_id', user.id).eq('id', id).single();
  if (existing && existing.status !== 'draft') {
    return NextResponse.json({ error: `cannot edit campaign in '${existing.status}' state` }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const { data, error } = await supabase
    .from('email_campaigns')
    .update(patch)
    .eq('user_id', user.id)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
