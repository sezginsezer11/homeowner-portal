// lib/email/domain-router.ts
// Picks which sending domain to use for the next message.

import { getEmailServiceClient } from './supabase-server';
import type { SendingDomain, RotationStrategy } from './types-phase3';

/** Effective per-day quota during warmup. Stage 1 = 5%, stage 10 = 100% of daily_quota. */
function effectiveQuota(d: SendingDomain): number {
  const factor = Math.max(0.05, d.warmup_stage / 10);
  return Math.floor(d.daily_quota * factor);
}

export interface DomainPickerOptions {
  userId: string;
  domainIds?: string[];           // explicit pool from the campaign
  poolTag?: string;               // OR a tag-based pool (e.g. 'newsletter')
  strategy: RotationStrategy;
  recipientEmail?: string;        // used for sticky_recipient
  rrCursor?: number;              // optional round-robin position carried by caller
}

export interface PickedDomain {
  domain: SendingDomain;
  fromAddress: string;            // ready-to-use "Name <local@domain>"
  cursorNext: number;             // updated round-robin cursor
}

export async function pickDomain(opts: DomainPickerOptions): Promise<PickedDomain | null> {
  const supabase = getEmailServiceClient();

  // Reset any stale daily counters first
  await supabase.rpc('email_reset_daily_quotas', { p_user_id: opts.userId });

  // Build the candidate pool
  let q = supabase
    .from('email_sending_domains')
    .select('*')
    .eq('user_id', opts.userId)
    .eq('is_active', true)
    .eq('status', 'verified');

  if (opts.domainIds && opts.domainIds.length > 0) {
    q = q.in('id', opts.domainIds);
  } else if (opts.poolTag) {
    q = q.contains('pool_tags', [opts.poolTag]);
  }

  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;

  // Filter to those still under their effective daily quota
  const available = (data as SendingDomain[]).filter(d => d.daily_sent_today < effectiveQuota(d));
  if (available.length === 0) return null;

  let chosen: SendingDomain;
  let cursorNext = (opts.rrCursor ?? 0);

  switch (opts.strategy) {
    case 'round_robin': {
      const idx = ((opts.rrCursor ?? 0) % available.length + available.length) % available.length;
      chosen = available[idx];
      cursorNext = (idx + 1) % available.length;
      break;
    }
    case 'weighted': {
      const total = available.reduce((s, d) => s + Math.max(1, d.weight), 0);
      let r = Math.random() * total;
      chosen = available[0];
      for (const d of available) { r -= Math.max(1, d.weight); if (r <= 0) { chosen = d; break; } }
      break;
    }
    case 'sticky_recipient': {
      // Hash the recipient to a stable index — same recipient always gets same domain
      const e = (opts.recipientEmail || '').toLowerCase();
      let h = 0;
      for (let i = 0; i < e.length; i++) h = (h * 31 + e.charCodeAt(i)) | 0;
      chosen = available[Math.abs(h) % available.length];
      break;
    }
    case 'random':
    default: {
      chosen = available[Math.floor(Math.random() * available.length)];
    }
  }

  const fromName = chosen.default_from_name ? `${chosen.default_from_name} ` : '';
  const fromAddress = `${fromName}<${chosen.default_from_local}@${chosen.domain}>`;

  return { domain: chosen, fromAddress, cursorNext };
}

/** Increment the daily_sent_today counter for a domain. Called after each successful send. */
export async function incrementDomainCounter(domainId: string): Promise<void> {
  const supabase = getEmailServiceClient();
  // Use raw SQL increment for atomicity
  await supabase.rpc('email_increment_domain_counter', { p_domain_id: domainId }).then(
    () => {},
    async () => {
      // Fallback if RPC isn't installed: fetch + update (race-prone but acceptable for low volume)
      const { data } = await supabase.from('email_sending_domains').select('daily_sent_today').eq('id', domainId).single();
      if (data) {
        await supabase.from('email_sending_domains')
          .update({ daily_sent_today: (data.daily_sent_today ?? 0) + 1 })
          .eq('id', domainId);
      }
    }
  );
}
