// app/api/email/tags/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';

// GET /api/email/tags  — returns tags with contact counts
export async function GET() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: tags, error } = await supabase
    .from('email_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Counts per tag
  const counts: Record<string, number> = {};
  if (tags && tags.length > 0) {
    const ids = tags.map(t => t.id);
    const { data: junc } = await supabase
      .from('email_contact_tags')
      .select('tag_id')
      .in('tag_id', ids);
    for (const j of junc || []) counts[j.tag_id] = (counts[j.tag_id] || 0) + 1;
  }

  return NextResponse.json({
    tags: (tags || []).map(t => ({ ...t, contact_count: counts[t.id] || 0 })),
  });
}

// POST /api/email/tags  { name, color?, description? }
export async function POST(req: Request) {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, color, description } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('email_tags')
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color || '#344a57',
      description: description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tag: data });
}
