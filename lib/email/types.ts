// lib/email/types.ts
// Shared types for the email platform module.

export type ContactStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained' | 'pending';

export interface EmailContact {
  id: string;
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  custom_fields?: Record<string, unknown>;
  status: ContactStatus;
  source?: string | null;
  created_at: string;
  updated_at: string;
  tags?: EmailTag[]; // joined client-side
}

export interface EmailTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description?: string | null;
  created_at: string;
  contact_count?: number; // joined client-side
}

export interface EmailContactTag {
  contact_id: string;
  tag_id: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject?: string | null;
  preheader?: string | null;
  html_body?: string | null;
  design_json?: unknown;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';

export interface EmailCampaign {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  preheader?: string | null;
  from_name: string;
  from_email: string;
  reply_to?: string | null;
  template_id?: string | null;
  html_body?: string | null;
  segment?: SegmentDefinition;
  status: CampaignStatus;
  scheduled_at?: string | null;
  sent_at?: string | null;
  total_recipients: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  total_unsubs: number;
  created_at: string;
  updated_at: string;
}

// A segment is a tag-based + status-based filter. Phase 5 extends this.
export interface SegmentDefinition {
  include_tags?: string[];   // tag IDs — contact must have ANY of these
  exclude_tags?: string[];   // contact must NOT have any of these
  statuses?: ContactStatus[];
  match_all_tags?: boolean;  // if true, contact must have ALL include_tags
}

export type EventType = 'sent' | 'delivered' | 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe';

export interface EmailEvent {
  id: string;
  user_id: string;
  campaign_id?: string | null;
  contact_id?: string | null;
  recipient_id?: string | null;
  event_type: EventType;
  url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

export type EmailProvider = 'none' | 'smtp' | 'sendgrid' | 'ses' | 'postmark' | 'resend' | 'mailgun';

export interface EmailSettings {
  user_id: string;
  provider: EmailProvider;
  from_name?: string | null;
  from_email?: string | null;
  reply_to?: string | null;
  sending_domain?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  smtp_secure?: boolean;
  tracking_domain?: string | null;
  track_opens: boolean;
  track_clicks: boolean;
  // Secrets (smtp_password_enc, api_key_enc) never returned to the client.
}
