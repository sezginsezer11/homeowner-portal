// app/api/email/contacts/import/route.ts
// POST a CSV import. Body: { rows: Array<Record<string,string>>, default_tag_ids?: string[] }
// Each row must have an "email" key. Other recognized: first_name, last_name, phone, company, notes.
// Unknown columns are stored in custom_fields.

import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';

const KNOWN = new Set(['email','first_name','last_name','phone','company','notes','status','source']);

export async function POST(req: Request) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { rows, default_tag_ids } = await req.json();
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'rows array required' }, { status: 400 });

  let inserted = 0, updated = 0, skipped = 0;
  const inserted_ids: string[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const email = String(r.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) { skipped++; continue; }

    const custom: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      if (!KNOWN.has(k) && k !== 'email' && v != null && v !== '') custom[k] = String(v);
    }

    const payload = {
      user_id: user.id,
      email,
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      phone: r.phone || null,
      company: r.company || null,
      notes: r.notes || null,
      custom_fields: custom,
      status: r.status || 'subscribed',
      source: r.source || 'csv_import',
    };

    const { data, error } = await supabase
      .from('email_contacts')
      .upsert(payload, { onConflict: 'user_id,email' })
      .select('id')
      .single();

    if (error) { errors.push({ row: i, error: error.message }); continue; }
    if (data?.id) { inserted_ids.push(data.id); inserted++; }
  }

  // Apply default tags to all imported rows
  if (Array.isArray(default_tag_ids) && default_tag_ids.length > 0 && inserted_ids.length > 0) {
    const junction: { contact_id: string; tag_id: string }[] = [];
    for (const cid of inserted_ids) for (const tid of default_tag_ids) junction.push({ contact_id: cid, tag_id: tid });
    // ignore duplicate-key errors
    await supabase.from('email_contact_tags').upsert(junction, { onConflict: 'contact_id,tag_id', ignoreDuplicates: true });
  }

  return NextResponse.json({ inserted, updated, skipped, errors });
}
