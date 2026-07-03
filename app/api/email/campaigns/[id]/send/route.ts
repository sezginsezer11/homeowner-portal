// app/api/email/campaigns/[id]/send/route.ts
// POST — kicks off the send. Resolves segment, creates recipient rows,
// then dispatches in batches inside the request (good for solo-agent volumes).
// For very large lists (>1k), wrap this in a background job / Vercel Cron.

import { NextResponse } from 'next/server';
import { getEmailSupabase, getEmailServiceClient } from '@/lib/email/supabase-server';
import { resolveSegment } from '@/lib/email/segment';
import { sendOne } from '@/lib/email/sender';

const BATCH_LIMIT = 250;       // max recipients dispatched in one request
const PER_MESSAGE_DELAY_MS = 100; // ~10/sec — stay under SES default rate

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = getEmailServiceClient();

  const { data: campaign, error } = await supabase
    .from('email_campaigns').select('*')
    .eq('user_id', user.id).eq('id', params.id).single();
  if (error || !campaign) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    return NextResponse.json({ error: `cannot send a '${campaign.status}' campaign` }, { status: 400 });
  }
  if (!campaign.html_body || !campaign.subject) {
    return NextResponse.json({ error: 'subject and body required' }, { status: 400 });
  }

  // 1) Resolve segment
  const seg = await resolveSegment(user.id, campaign.segment || {});
  if (seg.contacts.length === 0) {
    return NextResponse.json({ error: 'segment is empty after suppression', suppressed: seg.suppressed_count }, { status: 400 });
  }

  // 2) Mark campaign sending + create recipient rows (skip already-queued/sent on resume)
  await service.from('email_campaigns').update({ status: 'sending', total_recipients: seg.contacts.length })
    .eq('id', campaign.id);

  const recipientRows = seg.contacts.map(c => ({ campaign_id: campaign.id, contact_id: c.id, status: 'queued' as const }));
  await service.from('email_campaign_recipients').upsert(recipientRows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true });

  // 3) Pull queued recipients (cap to BATCH_LIMIT this request)
  const { data: queued } = await service
    .from('email_campaign_recipients')
    .select('contact_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'queued')
    .limit(BATCH_LIMIT);

  const contactIds = (queued || []).map(r => r.contact_id);
  if (contactIds.length === 0) {
    await service.from('email_campaigns').update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaign.id);
    return NextResponse.json({ ok: true, sent: 0, complete: true });
  }

  const { data: contacts } = await service
    .from('email_contacts').select('*').in('id', contactIds);

  // 4) Dispatch
  let cursor = 0;
  let sent = 0, failed = 0;
  for (const contact of (contacts || [])) {
    const res = await sendOne({ userId: user.id, campaign, contact: contact as any, rrCursor: cursor });
    if (res.success) { sent++; if (typeof res.cursorNext === 'number') cursor = res.cursorNext; }
    else failed++;
    // Light throttle so we don't blow past SES per-second limits
    if (PER_MESSAGE_DELAY_MS > 0) await new Promise(r => setTimeout(r, PER_MESSAGE_DELAY_MS));
  }

  // 5) Update campaign totals; mark complete if nothing remains queued
  await service.rpc('exec_sql', {}).then(() => {}, () => {}); // no-op placeholder
  const { count: remaining } = await service
    .from('email_campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'queued');

  if ((remaining ?? 0) === 0) {
    await service.from('email_campaigns').update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaign.id);
  }

  return NextResponse.json({
    ok: true,
    sent, failed,
    remaining_queued: remaining ?? 0,
    complete: (remaining ?? 0) === 0,
    note: (remaining ?? 0) > 0 ? 'Call this endpoint again to continue, or set up a cron job.' : undefined,
  });
}
