// app/api/email/templates/[id]/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { renderDesignToHtml } from '@/lib/email/render-blocks';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id).eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ template: data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ['name', 'subject', 'preheader'] as const) {
    if (k in body) patch[k] = body[k];
  }
  if ('design' in body) {
    patch.design_json = body.design;
    patch.html_body = renderDesignToHtml(body.design, {
      subject: body.subject ?? '',
      preheader: body.preheader ?? '',
    });
  }

  const { data, error } = await supabase
    .from('email_templates')
    .update(patch)
    .eq('user_id', user.id).eq('id', params.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('user_id', user.id).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
