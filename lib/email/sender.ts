// lib/email/sender.ts
// Orchestrates the actual send: picks a domain, renders the template,
// sends through SES, logs the event, increments counters.

import { sesSendEmail } from './ses-client';
import { pickDomain, incrementDomainCounter } from './domain-router';
import { renderTemplate, renderSubject } from './template-render';
import { getEmailServiceClient } from './supabase-server';
import type { EmailContact, EmailCampaign } from './types';

export interface SendOneInput {
  userId: string;
  campaign: EmailCampaign;
  contact: EmailContact;
  rrCursor?: number;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  domainId?: string;
  fromAddress?: string;
  error?: string;
  cursorNext?: number;
}

export async function sendOne(input: SendOneInput): Promise<SendResult> {
  const { userId, campaign, contact } = input;
  const supabase = getEmailServiceClient();

  // 1) Pick a domain
  const picked = await pickDomain({
    userId,
    domainIds: (campaign as any).domain_ids,
    poolTag:   (campaign as any).domain_pool_tag,
    strategy:  (campaign as any).rotation_strategy || 'round_robin',
    recipientEmail: contact.email,
    rrCursor: input.rrCursor,
  });
  if (!picked) {
    return { success: false, error: 'no_available_domain' };
  }

  // 2) Find the recipient row (created when the campaign was prepared)
  const { data: recipient } = await supabase
    .from('email_campaign_recipients')
    .select('id, tracking_id')
    .eq('campaign_id', campaign.id)
    .eq('contact_id', contact.id)
    .single();
  if (!recipient) {
    return { success: false, error: 'recipient_not_found' };
  }

  const appUrl = process.env.APP_URL || 'https://360everywhere.com';
  const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?t=${recipient.tracking_id}`;
  const trackingPixelUrl = `${appUrl}/api/email/track/open/${recipient.tracking_id}.gif`;

  // 3) Render template
  const html = renderTemplate(campaign.html_body || '', {
    contact,
    unsubscribeUrl,
    trackingPixelUrl,
    fallbacks: { first_name: 'there' },
  });
  const subject = renderSubject(campaign.subject, { contact, fallbacks: { first_name: 'there' } });

  // 4) Send through SES
  let messageId: string | undefined;
  try {
    messageId = await sesSendEmail({
      region: picked.domain.region,
      fromAddress: picked.fromAddress,
      to: contact.email,
      replyTo: picked.domain.default_reply_to || campaign.reply_to || undefined,
      subject,
      html,
      configurationSetName: process.env.AWS_SES_CONFIGURATION_SET,
      customHeaders: [
        { Name: 'List-Unsubscribe', Value: `<${unsubscribeUrl}>` },
        { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
      ],
      tags: [
        { Name: 'campaign_id', Value: campaign.id.replace(/-/g, '') },
        { Name: 'user_id',     Value: userId.replace(/-/g, '') },
      ],
    });
  } catch (err: any) {
    // Mark recipient failed
    await supabase.from('email_campaign_recipients').update({
      status: 'failed',
      error_message: String(err?.message || err).slice(0, 500),
      sending_domain_id: picked.domain.id,
    }).eq('id', recipient.id);
    return { success: false, domainId: picked.domain.id, error: err?.message || 'send_failed' };
  }

  // 5) Update recipient + log event + increment domain counter
  await Promise.all([
    supabase.from('email_campaign_recipients').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sending_domain_id: picked.domain.id,
      from_address: picked.fromAddress,
      ses_message_id: messageId,
    }).eq('id', recipient.id),

    supabase.from('email_events').insert({
      user_id: userId,
      campaign_id: campaign.id,
      contact_id: contact.id,
      recipient_id: recipient.id,
      event_type: 'sent',
      metadata: { domain_id: picked.domain.id, ses_message_id: messageId },
    }),

    incrementDomainCounter(picked.domain.id),
  ]);

  return {
    success: true,
    messageId,
    domainId: picked.domain.id,
    fromAddress: picked.fromAddress,
    cursorNext: picked.cursorNext,
  };
}
