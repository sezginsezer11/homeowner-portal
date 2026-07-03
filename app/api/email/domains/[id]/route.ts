// app/api/email/domains/[id]/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { sesDeleteDomainIdentity } from '@/lib/email/ses-client';
import { buildDnsInstructions } from '../route';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_sending_domains')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const dns = buildDnsInstructions(data.domain, data.dkim_tokens || []);
  return NextResponse.json({ domain: data, dns });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = [
    'is_active', 'default_from_name', 'default_from_local', 'default_reply_to',
    'pool_tags', 'daily_quota', 'warmup_stage', 'weight', 'notes',
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const { data, error } = await supabase
    .from('email_sending_domains')
    .update(patch)
    .eq('user_id', user.id)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ domain: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('email_sending_domains')
    .select('domain, region')
    .eq('user_id', user.id)
    .eq('id', id)
    .single();

  if (data) {
    try { await sesDeleteDomainIdentity(data.domain, data.region); } catch {/* best-effort */}
  }

  const { error } = await supabase
    .from('email_sending_domains')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
