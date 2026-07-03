-- ============================================================
-- EMAIL PLATFORM SCHEMA — Phase 3
-- Adds: sending domains (multi-domain support), suppression list,
-- and campaign columns for domain pool + rotation strategy.
-- Run AFTER the Phase 1 migration.
-- ============================================================

-- ----- SENDING DOMAINS -------------------------------------
-- Each user can register many sending domains; campaigns can
-- target a pool (by tag) and rotate across them.
create table if not exists email_sending_domains (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  domain                text not null,
  region                text not null default 'us-east-1',         -- SES region
  status                text not null default 'pending'
                        check (status in ('pending','verifying','verified','failed','paused','blacklisted')),
  -- DKIM records SES returns when you create the identity
  dkim_tokens           text[] default array[]::text[],
  -- Authentication health (last DNS check)
  spf_ok                boolean default false,
  dkim_ok               boolean default false,
  dmarc_ok              boolean default false,
  last_checked_at       timestamptz,
  -- Capacity & warmup
  daily_quota           int not null default 50,                    -- soft cap per day for THIS domain
  daily_sent_today      int not null default 0,
  daily_reset_at        date default current_date,
  warmup_stage          int not null default 1                      -- 1..10, controls effective quota
                        check (warmup_stage between 1 and 10),
  -- Rotation behavior
  weight                int not null default 1,                     -- higher = picked more often
  is_active             boolean not null default true,
  pool_tags             text[] not null default array[]::text[],    -- e.g. ['newsletter'] or ['prospecting']
  -- From defaults for this domain
  default_from_name     text,
  default_from_local    text default 'hello',                       -- becomes hello@<domain>
  default_reply_to      text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, domain)
);

create index if not exists idx_email_sending_domains_user   on email_sending_domains(user_id);
create index if not exists idx_email_sending_domains_active on email_sending_domains(user_id, is_active, status);
create index if not exists idx_email_sending_domains_pools  on email_sending_domains using gin (pool_tags);

alter table email_sending_domains enable row level security;
create policy "owner can read sending_domains"  on email_sending_domains for select using (auth.uid() = user_id);
create policy "owner can write sending_domains" on email_sending_domains for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_email_sending_domains_updated before update on email_sending_domains
  for each row execute function email_set_updated_at();

-- ----- SUPPRESSION LIST ------------------------------------
-- Permanent block list across all campaigns. Populated by
-- bounces, complaints, and manual entries. Compliance + reputation.
create table if not exists email_suppression_list (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  reason       text not null
               check (reason in ('hard_bounce','soft_bounce_repeat','complaint','manual','unsubscribe','spam_trap')),
  source       text,
  campaign_id  uuid references email_campaigns(id) on delete set null,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  unique (user_id, email)
);
create index if not exists idx_email_suppression_user on email_suppression_list(user_id);
create index if not exists idx_email_suppression_email on email_suppression_list(user_id, email);

alter table email_suppression_list enable row level security;
create policy "owner can read suppression" on email_suppression_list for select using (auth.uid() = user_id);
create policy "service can write suppression" on email_suppression_list for insert with check (true);
create policy "owner can delete suppression" on email_suppression_list for delete using (auth.uid() = user_id);

-- ----- CAMPAIGNS — add multi-domain rotation columns -------
alter table email_campaigns
  add column if not exists domain_pool_tag    text,                -- e.g. 'newsletter' or 'prospecting'
  add column if not exists domain_ids         uuid[] default array[]::uuid[],
  add column if not exists rotation_strategy  text default 'round_robin'
    check (rotation_strategy in ('round_robin','weighted','random','sticky_recipient'));

-- ----- CAMPAIGN RECIPIENTS — track which domain was used ---
alter table email_campaign_recipients
  add column if not exists sending_domain_id  uuid references email_sending_domains(id) on delete set null,
  add column if not exists from_address       text,
  add column if not exists ses_message_id     text;

create index if not exists idx_ecr_ses_message on email_campaign_recipients(ses_message_id);

-- ----- DAILY QUOTA RESET FUNCTION --------------------------
-- Call this from the send pipeline before picking a domain.
create or replace function email_reset_daily_quotas(p_user_id uuid)
returns void language plpgsql as $$
begin
  update email_sending_domains
     set daily_sent_today = 0,
         daily_reset_at   = current_date
   where user_id = p_user_id
     and daily_reset_at < current_date;
end $$;

-- ----- HELPFUL VIEW: per-domain stats today ----------------
create or replace view email_domain_health as
select d.id,
       d.user_id,
       d.domain,
       d.status,
       d.is_active,
       d.warmup_stage,
       d.daily_quota,
       d.daily_sent_today,
       (d.daily_quota - d.daily_sent_today) as remaining_today,
       d.pool_tags,
       d.weight,
       d.spf_ok,
       d.dkim_ok,
       d.dmarc_ok
from email_sending_domains d;
