-- FORME Fashion Store — Migration 002: Advanced Product Images & Storage
-- Run this in the Supabase SQL Editor.
-- This migration is idempotent and non-destructive.

-- ============================================================
-- 1. Create or configure `product-images` Storage Bucket
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB max file size
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================
-- 2. Storage Row-Level Security Policies for `product-images`
-- ============================================================

-- Allow public read access to all images in the product-images bucket
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- Allow upload of product images
drop policy if exists "admin upload product images" on storage.objects;
drop policy if exists "allow upload product images" on storage.objects;
create policy "allow upload product images"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'product-images');

-- Allow update / replace of product images
drop policy if exists "admin update product images" on storage.objects;
drop policy if exists "allow update product images" on storage.objects;
create policy "allow update product images"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- Allow delete of product images
drop policy if exists "admin delete product images" on storage.objects;
drop policy if exists "allow delete product images" on storage.objects;
create policy "allow delete product images"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'product-images');

-- ============================================================
-- 3. Extend `products` Table for Structured Images
-- ============================================================

-- Add primary_image column if not present
alter table public.products
  add column if not exists primary_image text;

-- Populate primary_image from legacy image_url if null
update public.products
  set primary_image = image_url
  where primary_image is null and image_url is not null;

-- Safely convert `images` column to JSONB if it's currently text[]
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'images'
      and data_type <> 'jsonb'
  ) then
    alter table public.products
      alter column images drop default,
      alter column images type jsonb using to_jsonb(images),
      alter column images set default '[]'::jsonb;
  end if;
end $$;
