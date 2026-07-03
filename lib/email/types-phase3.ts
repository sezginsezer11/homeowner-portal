// lib/email/types-phase3.ts
// Phase 3 additions. Import alongside Phase 1 types.

export type SendingDomainStatus = 'pending' | 'verifying' | 'verified' | 'failed' | 'paused' | 'blacklisted';

export interface SendingDomain {
  id: string;
  user_id: string;
  domain: string;
  region: string;
  status: SendingDomainStatus;
  dkim_tokens: string[];
  spf_ok: boolean;
  dkim_ok: boolean;
  dmarc_ok: boolean;
  last_checked_at?: string | null;
  daily_quota: number;
  daily_sent_today: number;
  daily_reset_at: string;
  warmup_stage: number;
  weight: number;
  is_active: boolean;
  pool_tags: string[];
  default_from_name?: string | null;
  default_from_local: string;
  default_reply_to?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type RotationStrategy = 'round_robin' | 'weighted' | 'random' | 'sticky_recipient';

export type SuppressionReason =
  | 'hard_bounce'
  | 'soft_bounce_repeat'
  | 'complaint'
  | 'manual'
  | 'unsubscribe'
  | 'spam_trap';

export interface SuppressionEntry {
  id: string;
  user_id: string;
  email: string;
  reason: SuppressionReason;
  source?: string | null;
  campaign_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// DNS records to display to the user during domain setup
export interface DnsInstructions {
  domain: string;
  dkim: { host: string; type: 'CNAME'; value: string }[];
  spf:  { host: string; type: 'TXT'; value: string };
  dmarc:{ host: string; type: 'TXT'; value: string };
  mxNote: string;
}
