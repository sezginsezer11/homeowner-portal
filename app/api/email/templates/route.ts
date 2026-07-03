// app/api/email/templates/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { renderDesignToHtml } from '@/lib/email/render-blocks';
import { DEFAULT_DESIGN } from '@/lib/email/blocks';

export async function GET() {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_templates')
    .select('id, name, subject, preheader, updated_at, created_at, thumbnail_url')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data || [] });
}

export async function POST(req: Request) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || 'Untitled template').trim();
  const subject = body.subject || '';
  const preheader = body.preheader || '';
  const design = body.design || DEFAULT_DESIGN;
  const html = renderDesignToHtml(design, { subject, preheader });

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      user_id: user.id,
      name, subject, preheader,
      design_json: design,
      html_body: html,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}
