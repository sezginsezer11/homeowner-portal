-- Run in Supabase SQL Editor
-- Replaces instant connections with a request/approval system

-- Drop old relationships table and recreate with requests
drop table if exists public.relationships cascade;

create table public.relationships (
  id uuid default gen_random_uuid() primary key,
  homeowner_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  professional_role text check (professional_role in ('agent', 'lender')) not null,
  status text check (status in ('pending', 'accepted', 'declined')) not null default 'pending',
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(homeowner_id, professional_id)
);

alter table public.relationships enable row level security;

-- Homeowners can see requests sent to them
create policy "Homeowners can view their requests" on public.relationships
  for select using (auth.uid() = homeowner_id);

-- Professionals can see their own sent requests
create policy "Professionals can view their requests" on public.relationships
  for select using (auth.uid() = professional_id);

-- Only professionals can send requests
create policy "Professionals can send requests" on public.relationships
  for insert with check (auth.uid() = professional_id);

-- Homeowners can accept/decline, professionals can cancel
create policy "Users can update their relationships" on public.relationships
  for update using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- Both can delete
create policy "Users can delete relationships" on public.relationships
  for delete using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- Professionals can view homeowner profiles only if connected (accepted)
create policy "Professionals can view accepted homeowner profiles" on public.profiles
  for select using (
    auth.uid() = id or
    exists (
      select 1 from public.relationships
      where (homeowner_id = profiles.id and professional_id = auth.uid() and status = 'accepted')
         or (professional_id = profiles.id and homeowner_id = auth.uid() and status = 'accepted')
    )
  );

-- Professionals can view accepted properties
create policy "Professionals can view accepted properties" on public.properties
  for select using (
    owner_id = auth.uid() or
    exists (
      select 1 from public.relationships
      where homeowner_id = properties.owner_id
        and professional_id = auth.uid()
        and status = 'accepted'
    )
  );
