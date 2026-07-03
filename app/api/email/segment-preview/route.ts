// app/api/email/segment-preview/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase, getEmailServiceClient } from '@/lib/email/supabase-server';
import { resolveSegment } from '@/lib/email/segment';

export async function POST(req: Request) {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { segment } = await req.json();
  const r = await resolveSegment(user.id, segment || {});

  return NextResponse.json({
    total_in_segment: r.total_in_segment,
    deliverable: r.contacts.length,
    suppressed_count: r.suppressed_count,
    sample: r.contacts.slice(0, 10).map(c => ({
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
    })),
  });
}
