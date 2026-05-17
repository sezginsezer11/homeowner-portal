-- Run this in Supabase SQL Editor to add new profile fields

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists website text,
  add column if not exists license_number text,
  add column if not exists bio text,
  add column if not exists notification_value_frequency text default 'monthly'
    check (notification_value_frequency in ('monthly','bimonthly','quarterly','biannually','annually')),
  add column if not exists notification_messages boolean default true,
  add column if not exists notification_rate_alerts boolean default true;

-- Allow public storage for avatars
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
