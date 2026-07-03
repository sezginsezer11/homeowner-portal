// app/api/email/unsubscribe/route.ts
// GET/POST  ?t=<tracking_id>  — RFC 8058 one-click unsubscribe.
// Updates contact status + adds suppression entry.

import { NextResponse } from 'next/server';
import { getEmailServiceClient } from '@/lib/email/supabase-server';

async function handle(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t');
  if (!t) return new Response('Missing token', { status: 400 });

  const service = getEmailServiceClient();
  const { data: rec } = await service
    .from('email_campaign_recipients')
    .select('id, contact_id, campaign_id, email_campaigns!inner(user_id)')
    .eq('tracking_id', t)
    .maybeSingle();

  if (!rec) {
    return new Response('Already unsubscribed or invalid link.', { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  const userId = (rec as any).email_campaigns?.user_id;
  const contactId = rec.contact_id;

  // Look up email for the suppression row
  const { data: contact } = await service.from('email_contacts').select('email').eq('id', contactId).single();

  if (contact?.email && userId) {
    await service.from('email_suppression_list').upsert({
      user_id: userId, email: contact.email, reason: 'unsubscribe', source: 'one_click', campaign_id: rec.campaign_id,
    }, { onConflict: 'user_id,email', ignoreDuplicates: true });
  }

  await service.from('email_contacts').update({ status: 'unsubscribed' }).eq('id', contactId);

  await service.from('email_events').insert({
    user_id: userId, campaign_id: rec.campaign_id, contact_id: contactId, recipient_id: rec.id,
    event_type: 'unsubscribe',
  });

  // RFC 8058 expects 200 with empty body on POST one-click. For GET, return a friendly page.
  if (req.method === 'POST') return new Response('', { status: 200 });
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
     <style>body{font:16px/1.6 system-ui,sans-serif;max-width:520px;margin:80px auto;padding:0 20px;color:#344a57;text-align:center}</style></head>
     <body><h1 style="font-family:Georgia,serif">You've been unsubscribed.</h1>
     <p>You won't receive further emails from this list. If this was a mistake, please reply directly to any past message.</p>
     </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export const GET = handle;
export const POST = handle;
