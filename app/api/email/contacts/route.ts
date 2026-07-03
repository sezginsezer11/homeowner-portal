// app/api/email/contacts/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import type { ContactStatus } from '@/lib/email/types';

// GET /api/email/contacts?search=&tag=&status=&page=1&page_size=50
export async function GET(req: Request) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const search   = url.searchParams.get('search')?.trim() || '';
  const tagId    = url.searchParams.get('tag') || '';
  const status   = url.searchParams.get('status') as ContactStatus | null;
  const page     = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
  const pageSize = Math.min(Math.max(parseInt(url.searchParams.get('page_size') || '50'), 1), 200);

  let query = supabase
    .from('email_contacts')
    .select('*, email_contact_tags(tag_id, email_tags(id, name, color))', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (status) query = query.eq('status', status);

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten tag join
  let contacts = (data || []).map((c: any) => ({
    ...c,
    tags: (c.email_contact_tags || []).map((j: any) => j.email_tags).filter(Boolean),
    email_contact_tags: undefined,
  }));

  // Optional tag filter (post-fetch — Phase 5 will move this into SQL)
  if (tagId) {
    contacts = contacts.filter((c: any) => c.tags?.some((t: any) => t.id === tagId));
  }

  return NextResponse.json({ contacts, total: count ?? contacts.length, page, page_size: pageSize });
}

// POST /api/email/contacts
export async function POST(req: Request) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, first_name, last_name, phone, company, notes, custom_fields, status, source, tag_ids } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const { data: contact, error } = await supabase
    .from('email_contacts')
    .insert({
      user_id: user.id,
      email: email.toLowerCase().trim(),
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
      custom_fields: custom_fields || {},
      status: status || 'subscribed',
      source: source || 'manual',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Attach tags if provided
  if (Array.isArray(tag_ids) && tag_ids.length > 0) {
    const rows = tag_ids.map((tag_id: string) => ({ contact_id: contact.id, tag_id }));
    await supabase.from('email_contact_tags').insert(rows);
  }

  return NextResponse.json({ contact });
}

// DELETE /api/email/contacts  (body: { ids: string[] })  — bulk
export async function DELETE(req: Request) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }
  const { error } = await supabase
    .from('email_contacts')
    .delete()
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: ids.length });
}
