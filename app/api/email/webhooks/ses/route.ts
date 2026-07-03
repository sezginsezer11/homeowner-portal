// app/api/email/webhooks/ses/route.ts
// AWS SNS webhook for SES events: Bounce, Complaint, Delivery, Open, Click.
// Configure SNS topic to POST to this URL. First request is SubscriptionConfirmation —
// we auto-confirm by fetching the SubscribeURL.

import { NextResponse } from 'next/server';
import { getEmailServiceClient } from '@/lib/email/supabase-server';

export async function POST(req: Request) {
  const raw = await req.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }

  // 1) SNS subscription confirmation handshake
  if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
    try { await fetch(body.SubscribeURL); } catch {/* ignore */}
    return NextResponse.json({ confirmed: true });
  }

  if (body.Type !== 'Notification') return NextResponse.json({ ignored: true });

  let payload: any;
  try { payload = JSON.parse(body.Message); } catch { return NextResponse.json({ error: 'bad payload' }, { status: 400 }); }

  const service = getEmailServiceClient();
  const messageId: string | undefined = payload?.mail?.messageId;

  // Locate recipient by SES message ID
  let recipientRow: any = null, userId: string | null = null, campaignId: string | null = null, contactId: string | null = null;
  if (messageId) {
    const { data } = await service
      .from('email_campaign_recipients')
      .select('id, contact_id, campaign_id, email_campaigns!inner(user_id)')
      .eq('ses_message_id', messageId).maybeSingle();
    if (data) {
      recipientRow = data;
      campaignId = data.campaign_id;
      contactId = data.contact_id;
      userId = (data as any).email_campaigns?.user_id;
    }
  }

  const eventType: string | undefined = payload.eventType || payload.notificationType;
  const recipients: string[] = []
    .concat(payload?.bounce?.bouncedRecipients?.map((r: any) => r.emailAddress) || [])
    .concat(payload?.complaint?.complainedRecipients?.map((r: any) => r.emailAddress) || [])
    .concat(payload?.delivery?.recipients || [])
    .concat(payload?.mail?.destination || []);

  // Resolve user_id even when we couldn't match by message ID (Phase 4 will tighten this)
  if (!userId && recipients.length) {
    const { data } = await service.from('email_contacts').select('user_id').eq('email', recipients[0]).limit(1).maybeSingle();
    if (data) userId = data.user_id;
  }
  if (!userId) return NextResponse.json({ ignored: true, reason: 'no user resolved' });

  const occurredAt = new Date().toISOString();

  if (eventType === 'Bounce' || payload.notificationType === 'Bounce') {
    const bounceType = payload.bounce?.bounceType; // 'Permanent' | 'Transient' | 'Undetermined'
    for (const email of recipients) {
      // Permanent bounce → suppress
      if (bounceType === 'Permanent') {
        await service.from('email_suppression_list').upsert({
          user_id: userId, email, reason: 'hard_bounce', source: 'ses_webhook', campaign_id: campaignId, metadata: payload.bounce,
        }, { onConflict: 'user_id,email', ignoreDuplicates: true });
        await service.from('email_contacts').update({ status: 'bounced' })
          .eq('user_id', userId).eq('email', email);
      }
      await service.from('email_events').insert({
        user_id: userId, campaign_id: campaignId, contact_id: contactId, recipient_id: recipientRow?.id,
        event_type: 'bounce', metadata: { bounceType, raw: payload.bounce }, occurred_at: occurredAt,
      });
    }
    if (recipientRow && bounceType === 'Permanent') {
      await service.from('email_campaign_recipients').update({ status: 'bounced', bounced_at: occurredAt }).eq('id', recipientRow.id);
    }
  }

  else if (eventType === 'Complaint' || payload.notificationType === 'Complaint') {
    for (const email of recipients) {
      await service.from('email_suppression_list').upsert({
        user_id: userId, email, reason: 'complaint', source: 'ses_webhook', campaign_id: campaignId, metadata: payload.complaint,
      }, { onConflict: 'user_id,email', ignoreDuplicates: true });
      await service.from('email_contacts').update({ status: 'complained' })
        .eq('user_id', userId).eq('email', email);
      await service.from('email_events').insert({
        user_id: userId, campaign_id: campaignId, contact_id: contactId, recipient_id: recipientRow?.id,
        event_type: 'complaint', metadata: payload.complaint, occurred_at: occurredAt,
      });
    }
  }

  else if (eventType === 'Delivery' || payload.notificationType === 'Delivery') {
    await service.from('email_events').insert({
      user_id: userId, campaign_id: campaignId, contact_id: contactId, recipient_id: recipientRow?.id,
      event_type: 'delivered', metadata: payload.delivery, occurred_at: occurredAt,
    });
  }

  return NextResponse.json({ ok: true });
}
