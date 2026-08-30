-- Run in Supabase SQL Editor
-- Backs the AI chat widget (public/widget.js + app/api/chat/route.js).
-- Every turn of every widget conversation gets logged here; escalated=true
-- means the AI flagged it (price/offer/negotiation/hot lead) for Sez.

create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  session_id text,
  page_url text,
  visitor_message text not null,
  bot_reply text not null,
  escalated boolean default false,
  escalate_reason text,
  lead_name text,
  lead_contact text,
  lead_notes text,
  created_at timestamptz default now()
);

create index if not exists chat_conversations_escalated_idx
  on public.chat_conversations (escalated, created_at desc);

create index if not exists chat_conversations_session_idx
  on public.chat_conversations (session_id);

alter table public.chat_conversations enable row level security;

-- Written only by the server (service-role client in app/api/chat/route.js),
-- which bypasses RLS — so no insert policy is needed for anonymous visitors.
-- This policy just lets Sez's own logged-in agent account read the log
-- (useful once there's a dashboard page listing escalated conversations).
create policy "Agents can view chat conversations"
  on public.chat_conversations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'agent'
    )
  );
