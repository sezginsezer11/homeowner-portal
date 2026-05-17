-- ============================================================
-- HOMEOWNER PORTAL — Paste this entire file into
-- Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ============================================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('homeowner', 'agent', 'lender')) not null default 'homeowner',
  full_name text,
  email text,
  phone text,
  company text,
  created_at timestamptz default now()
);

create table public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  address text not null,
  city text not null,
  state text not null default 'CA',
  zip text not null,
  purchase_price numeric(12,2),
  purchase_date date,
  loan_balance numeric(12,2),
  loan_rate numeric(5,3),
  loan_type text default 'Conventional',
  bedrooms integer,
  bathrooms numeric(3,1),
  sqft integer,
  year_built integer,
  created_at timestamptz default now()
);

create table public.relationships (
  id uuid default gen_random_uuid() primary key,
  homeowner_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  professional_role text check (professional_role in ('agent', 'lender')) not null,
  created_at timestamptz default now(),
  unique(homeowner_id, professional_id)
);

create table public.avm_snapshots (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  estimated_value numeric(12,2),
  low_value numeric(12,2),
  high_value numeric(12,2),
  equity numeric(12,2),
  pulled_at timestamptz default now()
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  subject text,
  body text not null,
  message_type text default 'general' check (message_type in ('general', 'value_update', 'rate_alert')),
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.relationships enable row level security;
alter table public.avm_snapshots enable row level security;
alter table public.messages enable row level security;

-- ============================================================
-- STEP 3: CREATE ALL POLICIES (after all tables exist)
-- ============================================================

-- PROFILES policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Professionals can view connected profiles" on public.profiles
  for select using (
    auth.uid() = id or
    exists (
      select 1 from public.relationships
      where (homeowner_id = profiles.id and professional_id = auth.uid())
         or (professional_id = profiles.id and homeowner_id = auth.uid())
    )
  );

-- PROPERTIES policies
create policy "Owners can manage their properties" on public.properties
  for all using (auth.uid() = owner_id);

create policy "Professionals can view connected properties" on public.properties
  for select using (
    owner_id = auth.uid() or
    exists (
      select 1 from public.relationships
      where homeowner_id = properties.owner_id
        and professional_id = auth.uid()
    )
  );

-- RELATIONSHIPS policies
create policy "Users can view their relationships" on public.relationships
  for select using (auth.uid() = homeowner_id or auth.uid() = professional_id);

create policy "Professionals can create relationships" on public.relationships
  for insert with check (auth.uid() = professional_id);

create policy "Users can delete their relationships" on public.relationships
  for delete using (auth.uid() = homeowner_id or auth.uid() = professional_id);

-- AVM SNAPSHOTS policies
create policy "Property owners can read AVM snapshots" on public.avm_snapshots
  for select using (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );

create policy "Property owners can insert AVM snapshots" on public.avm_snapshots
  for insert with check (
    exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
  );

create policy "Professionals can read connected AVM snapshots" on public.avm_snapshots
  for select using (
    exists (
      select 1 from public.properties p
      join public.relationships r on r.homeowner_id = p.owner_id
      where p.id = property_id and r.professional_id = auth.uid()
    )
  );

-- MESSAGES policies
create policy "Users can view their messages" on public.messages
  for select using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = from_id);

create policy "Recipients can mark messages read" on public.messages
  for update using (auth.uid() = to_id);

-- ============================================================
-- STEP 4: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'homeowner'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
