-- =====================================================================
-- Wanita Itu Vendor Promotion Portal — Supabase setup
-- Run this in the Supabase Dashboard > SQL Editor (paste all, then Run).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table: vendor_submissions
-- ---------------------------------------------------------------------
create table if not exists public.vendor_submissions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  vendor_name         text not null,
  contact_name        text not null,
  contact_phone       text not null,
  logo_url            text,
  join_coupon         boolean not null default false,
  coupon_type         text,            -- 'percentage' | 'fixed'
  coupon_value        numeric,
  coupon_limit_type   text,            -- 'unlimited' | 'limited'
  coupon_limit_value  integer,
  join_scratch_win    boolean not null default false,
  scratch_win_prize   text
);

-- Helpful index for the admin dashboard's "newest first" ordering
create index if not exists vendor_submissions_created_at_idx
  on public.vendor_submissions (created_at desc);

-- ---------------------------------------------------------------------
-- 2. Row Level Security
--    - Anyone (anon) may INSERT a submission from the public form.
--    - Only authenticated organizer accounts may SELECT (read) data.
--    - No one may UPDATE or DELETE via the API (omit those policies).
-- ---------------------------------------------------------------------
alter table public.vendor_submissions enable row level security;

-- Allow public/anonymous inserts (the vendor form uses the anon key)
drop policy if exists "Public can insert submissions" on public.vendor_submissions;
create policy "Public can insert submissions"
  on public.vendor_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Allow only logged-in organizers to read submissions
drop policy if exists "Authenticated can read submissions" on public.vendor_submissions;
create policy "Authenticated can read submissions"
  on public.vendor_submissions
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 3. Storage bucket: vendor-logos (public read so logos display)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vendor-logos', 'vendor-logos', true)
on conflict (id) do nothing;

-- Allow anyone to upload a logo (vendor form, anon key)
drop policy if exists "Public can upload vendor logos" on storage.objects;
create policy "Public can upload vendor logos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'vendor-logos');

-- Allow anyone to read logos (bucket is public; this covers API reads too)
drop policy if exists "Public can read vendor logos" on storage.objects;
create policy "Public can read vendor logos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'vendor-logos');

-- =====================================================================
-- 4. Create your admin (organizer) user
-- =====================================================================
-- Do NOT create users via SQL. Instead, in the Supabase Dashboard:
--   Authentication > Users > "Add user" (or "Invite user")
--   Enter the organizer email + password.
--   (Optional) Turn off "Confirm email" for that user, or confirm it,
--   so they can sign in immediately on the /admin page.
--
-- The app signs in with email/password via supabase.auth.signInWithPassword.
-- =====================================================================
