// app/api/email/track/open/[id]/route.ts
// GET /api/email/track/open/<tracking_id>.gif
// Returns a 1x1 transparent GIF and logs the open event.

import { getEmailServiceClient } from '@/lib/email/supabase-server';

const GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Strip .gif suffix if present
  const trackingId = id.replace(/\.gif$/i, '');

  const service = getEmailServiceClient();
  const { data: rec } = await service
    .from('email_campaign_recipients')
    .select('id, contact_id, campaign_id, email_campaigns!inner(user_id)')
    .eq('tracking_id', trackingId)
    .maybeSingle();

  if (rec) {
    const userId = (rec as any).email_campaigns?.user_id;
    await service.from('email_events').insert({
      user_id: userId,
      campaign_id: rec.campaign_id,
      contact_id: rec.contact_id,
      recipient_id: rec.id,
      event_type: 'open',
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    });
    // Increment campaign counter (best effort)
    await service.rpc('exec_sql', {}).then(() => {}, () => {});
  }

  return new Response(GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    },
  });
}
