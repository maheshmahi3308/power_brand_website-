-- FORME fashion store — schema extension migration
-- Run this in Supabase SQL Editor AFTER the base schema (schema.sql).
-- This migration is non-destructive and idempotent.

-- ============================================================
-- 1. Extend products table
-- ============================================================
alter table public.products
  add column if not exists short_description text,
  add column if not exists is_new_arrival boolean not null default false,
  add column if not exists is_on_offer boolean not null default false,
  add column if not exists publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived'));

-- Sync publication_status with existing is_published flag
update public.products set publication_status = 'published' where is_published = true;
update public.products set publication_status = 'draft' where is_published = false;

-- ============================================================
-- 2. Extend product_inquiries table for guest support + admin notes
-- ============================================================

-- Allow guest enquiries (user_id nullable)
alter table public.product_inquiries
  alter column user_id drop not null;

alter table public.product_inquiries
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists admin_notes text,
  add column if not exists reference_code text;

-- Add unique constraint on reference_code if not already there
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_inquiries_reference_code_key'
  ) then
    alter table public.product_inquiries add constraint product_inquiries_reference_code_key unique (reference_code);
  end if;
end $$;

-- For logged-out guests, validate that either user_id is set or guest_email provided
alter table public.product_inquiries
  drop constraint if exists inquiry_user_or_guest;
alter table public.product_inquiries
  add constraint inquiry_user_or_guest
  check (user_id is not null or (guest_email is not null and guest_email <> ''));

-- ============================================================
-- 3. Categories table
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default categories (Men, Women, and Small Kids only)
insert into public.categories (name, slug, sort_order, is_published) values
  ('Men''s Fashion', 'men', 1, true),
  ('Women''s Fashion', 'women', 2, true),
  ('Small Kids', 'kids', 3, true)
on conflict (slug) do nothing;

-- ============================================================
-- 4. Extend profiles with phone number
-- ============================================================
alter table public.profiles
  add column if not exists phone text,
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- 5. Site settings table (for homepage content management)
-- ============================================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed default settings
insert into public.site_settings (key, value) values
  ('announcement', '"COMPLIMENTARY STYLE ADVICE · CONTACT US BEFORE YOU BUY · FREE ENQUIRY SERVICE"'),
  ('hero', '{"headline": "Your Style. Your Brands. Better Choices.", "subtext": "Discover branded fashion, explore your favorite styles, and contact our team to enquire about availability and pricing.", "cta_primary": "Explore Collection", "cta_secondary": "Enquire About a Product"}'),
  ('contact', '{"name": "Y. Ramesh", "phone": "6302016103", "whatsapp": "916302016103"}')
on conflict (key) do nothing;

-- ============================================================
-- 6. Row Level Security for new tables
-- ============================================================
alter table public.categories enable row level security;
alter table public.site_settings enable row level security;

-- Categories: public can read published, admins manage all
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select to anon, authenticated using (is_published or public.is_admin());

drop policy if exists "categories admin manage" on public.categories;
create policy "categories admin manage" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Site settings: public can read, only admins can write
drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "site settings admin write" on public.site_settings;
create policy "site settings admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 7. Update product_inquiries RLS for guest support
-- ============================================================

-- Drop old insert policy (required user_id match)
drop policy if exists "customer create own inquiry" on public.product_inquiries;

-- New policy: logged-in users may insert for themselves; guests may insert if user_id is null
create policy "authenticated create own inquiry" on public.product_inquiries
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and consent = true
    and status = 'New'
  );

-- Allow anon (guest) enquiry submissions
drop policy if exists "guest create inquiry" on public.product_inquiries;
create policy "guest create inquiry" on public.product_inquiries
  for insert to anon
  with check (
    user_id is null
    and guest_email is not null
    and guest_email <> ''
    and consent = true
    and status = 'New'
  );

-- Admin notes: only admins can see/update admin_notes column
-- (Enforced by keeping admin_notes out of customer-facing queries)
drop policy if exists "admin full manage inquiries" on public.product_inquiries;
create policy "admin full manage inquiries" on public.product_inquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 8. Storage bucket setup note
-- ============================================================
-- Create a bucket named "product-images" in Supabase Storage dashboard.
-- Set it to PUBLIC for reads.
-- Add authenticated-only upload/delete policies for admins.
-- SQL for policies (run after creating bucket in dashboard):
--
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
--   on conflict (id) do nothing;
--
-- create policy "public read product images"
--   on storage.objects for select to anon, authenticated
--   using (bucket_id = 'product-images');
--
-- create policy "admin upload product images"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'product-images' and public.is_admin());
--
-- create policy "admin delete product images"
--   on storage.objects for delete to authenticated
--   using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================
-- 9. Promote first admin (replace with your email)
-- ============================================================
-- After verifying your account, run this ONCE:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
