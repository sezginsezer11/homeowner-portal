// app/api/email/campaigns/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';

export async function GET() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(req: Request) {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, subject, preheader, from_name, from_email, reply_to, html_body, segment, domain_pool_tag, domain_ids, rotation_strategy } = body;

  if (!name || !subject) {
    return NextResponse.json({ error: 'name and subject required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      user_id: user.id,
      name,
      subject,
      preheader: preheader || null,
      from_name: from_name || '',
      from_email: from_email || '',
      reply_to: reply_to || null,
      html_body: html_body || '',
      segment: segment || {},
      domain_pool_tag: domain_pool_tag || null,
      domain_ids: Array.isArray(domain_ids) ? domain_ids : [],
      rotation_strategy: rotation_strategy || 'round_robin',
      status: 'draft',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ campaign: data });
}
