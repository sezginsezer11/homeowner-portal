-- Run in Supabase SQL Editor

create table if not exists public.offer_requests (
  id uuid default gen_random_uuid() primary key,
  homeowner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade,
  address text not null,
  city text,
  state text,
  zip text,
  asking_price numeric(12,2),
  home_condition text check (home_condition in ('excellent','good','fair','needs_work')),
  timeline text check (timeline in ('asap','1_3_months','3_6_months','6_plus','just_curious')),
  cash_offers_only boolean default false,
  notes text,
  status text check (status in ('active','under_review','offer_received','closed','cancelled')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offer_requests enable row level security;

create policy "Homeowners can manage their offer requests"
  on public.offer_requests for all
  using (auth.uid() = homeowner_id)
  with check (auth.uid() = homeowner_id);

-- Agents/lenders can view active offer requests
create policy "Professionals can view active offer requests"
  on public.offer_requests for select
  using (
    status = 'active' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('agent', 'lender')
    )
  );
