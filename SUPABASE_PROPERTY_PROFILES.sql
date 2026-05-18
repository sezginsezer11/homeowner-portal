-- Run in Supabase SQL Editor

create table if not exists public.property_profiles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  state text,
  city text,
  address text,
  zip text,
  unit text,
  full_address text,

  -- Building data (fetched once, permanent)
  beds int,
  baths numeric(4,1),
  sqft int,
  year_built int,
  lot_size int,
  property_type text,
  stories int,
  parking text,
  hoa_fee numeric(10,2),
  heating text,
  cooling text,
  description text,
  photos jsonb default '[]'::jsonb,
  latitude numeric(10,7),
  longitude numeric(10,7),
  building_data_fetched_at timestamptz,

  -- Listing status (updated daily)
  listing_status text default 'unknown',
  list_price numeric(12,2),
  original_list_price numeric(12,2),
  days_on_market int,
  price_reduced boolean default false,
  listing_id text,
  mls_id text,
  listing_status_updated_at timestamptz,

  -- Sold data (fetched once, permanent)
  last_sale_price numeric(12,2),
  last_sale_date date,
  sold_history jsonb default '[]'::jsonb,
  sold_data_fetched_at timestamptz,

  -- AVM
  estimated_value numeric(12,2),
  avm_low numeric(12,2),
  avm_high numeric(12,2),

  -- Surroundings (fetched once, permanent)
  nearby_schools jsonb default '[]'::jsonb,
  walk_score int,
  noise_score int,
  nearby_amenities jsonb default '[]'::jsonb,
  surroundings_fetched_at timestamptz,

  -- Similar homes (fetched once)
  similar_homes jsonb default '[]'::jsonb,

  -- Listing agent
  listing_agent jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.property_profiles enable row level security;

-- Public read access (property pages are public)
create policy "Property profiles are publicly readable"
  on public.property_profiles for select
  to anon, authenticated
  using (true);

-- Only service role can insert/update (API routes use service key)
create policy "Service role can manage property profiles"
  on public.property_profiles for all
  to service_role
  using (true) with check (true);

-- Authenticated users can insert (for adding new properties)
create policy "Authenticated users can insert property profiles"
  on public.property_profiles for insert
  to authenticated
  with check (true);

-- Authenticated users can update (for refreshing data)
create policy "Authenticated users can update property profiles"
  on public.property_profiles for update
  to authenticated
  using (true);

-- Index for fast slug lookups
create index if not exists idx_property_profiles_slug on public.property_profiles(slug);
create index if not exists idx_property_profiles_city_state on public.property_profiles(city, state);
create index if not exists idx_property_profiles_listing_status on public.property_profiles(listing_status);
create index if not exists idx_property_profiles_status_updated on public.property_profiles(listing_status_updated_at);

