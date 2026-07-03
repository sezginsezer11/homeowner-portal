// app/api/email/contacts/[id]/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';

// GET /api/email/contacts/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_contacts')
    .select('*, email_contact_tags(tag_id, email_tags(id, name, color))')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const contact = {
    ...data,
    tags: (data.email_contact_tags || []).map((j: any) => j.email_tags).filter(Boolean),
    email_contact_tags: undefined,
  };
  return NextResponse.json({ contact });
}

// PATCH /api/email/contacts/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['email','first_name','last_name','phone','company','notes','custom_fields','status','source'];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  if (patch.email && typeof patch.email === 'string') {
    patch.email = patch.email.toLowerCase().trim();
  }

  const { data, error } = await supabase
    .from('email_contacts')
    .update(patch)
    .eq('user_id', user.id)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Optionally replace tag set
  if (Array.isArray(body.tag_ids)) {
    await supabase.from('email_contact_tags').delete().eq('contact_id', params.id);
    if (body.tag_ids.length > 0) {
      await supabase.from('email_contact_tags')
        .insert(body.tag_ids.map((tag_id: string) => ({ contact_id: params.id, tag_id })));
    }
  }

  return NextResponse.json({ contact: data });
}

// DELETE /api/email/contacts/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('email_contacts')
    .delete()
    .eq('user_id', user.id)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
