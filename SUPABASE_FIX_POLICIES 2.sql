-- Run this in Supabase SQL Editor to fix RLS policies

-- 1. Drop all existing policies on profiles and relationships
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Professionals can view accepted homeowner profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Homeowners can view their requests" on public.relationships;
drop policy if exists "Professionals can view their requests" on public.relationships;
drop policy if exists "Professionals can send requests" on public.relationships;
drop policy if exists "Users can update their relationships" on public.relationships;
drop policy if exists "Users can delete relationships" on public.relationships;

-- 2. Profiles policies
-- Allow anyone authenticated to read profiles (needed for email lookup)
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update only their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 3. Relationships policies
-- Users can see relationships they are part of
create policy "Users can view own relationships"
  on public.relationships for select
  to authenticated
  using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- Professionals (agents/lenders) can send requests
create policy "Professionals can insert relationships"
  on public.relationships for insert
  to authenticated
  with check (auth.uid() = professional_id);

-- Both parties can update (accept/decline/cancel)
create policy "Users can update own relationships"
  on public.relationships for update
  to authenticated
  using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- Both parties can delete
create policy "Users can delete own relationships"
  on public.relationships for delete
  to authenticated
  using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- 4. Properties - homeowners own their properties, professionals can see accepted clients
drop policy if exists "Professionals can view accepted properties" on public.properties;
drop policy if exists "Users can view own properties" on public.properties;
drop policy if exists "Users can insert own properties" on public.properties;
drop policy if exists "Users can update own properties" on public.properties;
drop policy if exists "Users can delete own properties" on public.properties;

create policy "Users can view own properties"
  on public.properties for select
  to authenticated
  using (
    owner_id = auth.uid() or
    exists (
      select 1 from public.relationships
      where homeowner_id = properties.owner_id
        and professional_id = auth.uid()
        and status = 'accepted'
    )
  );

create policy "Users can insert own properties"
  on public.properties for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update own properties"
  on public.properties for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can delete own properties"
  on public.properties for delete
  to authenticated
  using (owner_id = auth.uid());
