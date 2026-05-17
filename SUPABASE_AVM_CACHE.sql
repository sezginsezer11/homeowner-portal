-- Run this in Supabase SQL Editor
-- Adds AVM cache fields to properties table

alter table public.properties
  add column if not exists avm_value numeric(12,2),
  add column if not exists avm_low numeric(12,2),
  add column if not exists avm_high numeric(12,2),
  add column if not exists avm_last_updated timestamptz;
