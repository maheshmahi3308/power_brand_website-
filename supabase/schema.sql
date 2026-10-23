-- FORME branded fashion store — initial Supabase schema
-- Run in Supabase SQL Editor after reviewing. Do not place service-role keys in the frontend.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  logo_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  name text not null,
  slug text,
  category text not null default 'Men',
  description text,
  image_url text,
  images text[] not null default '{}',
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price <= price)),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  sku text,
  stock_quantity integer,
  availability text not null default 'Check availability',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  customer_name text not null,
  email text not null,
  phone text,
  size text,
  color text,
  quantity integer not null default 1 check (quantity between 1 and 20),
  message text,
  consent boolean not null default false check (consent = true),
  status text not null default 'New' check (status in ('New','Reviewing','Availability Confirmed','Awaiting Customer Response','Converted to Order','Closed','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.product_inquiries(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_public_idx on public.products(is_published, created_at desc);
create index if not exists inquiries_user_idx on public.product_inquiries(user_id, created_at desc);
create index if not exists inquiries_status_idx on public.product_inquiries(status, created_at desc);

-- Create a profile on signup. Role always defaults to customer; user metadata cannot set admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_inquiries enable row level security;
alter table public.inquiry_status_history enable row level security;
alter table public.wishlist_items enable row level security;

-- Profiles: users can read/update their own non-role profile; admins can read all.
drop policy if exists "profile select own or admin" on public.profiles;
create policy "profile select own or admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "profile update own name" on public.profiles;
create policy "profile update own name" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'customer');
drop policy if exists "profile admin update" on public.profiles;
create policy "profile admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public catalog can read published records; admins manage all catalog data.
drop policy if exists "published brands readable" on public.brands;
create policy "published brands readable" on public.brands for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admin manages brands" on public.brands;
create policy "admin manages brands" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "published products readable" on public.products;
create policy "published products readable" on public.products for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admin manages products" on public.products;
create policy "admin manages products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Customers can create/read their own inquiries. Only admins can read/manage all or update status.
drop policy if exists "customer create own inquiry" on public.product_inquiries;
create policy "customer create own inquiry" on public.product_inquiries for insert to authenticated with check (user_id = (select auth.uid()) and consent = true and status = 'New');
drop policy if exists "customer read own inquiries or admin" on public.product_inquiries;
create policy "customer read own inquiries or admin" on public.product_inquiries for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "admin update inquiries" on public.product_inquiries;
create policy "admin update inquiries" on public.product_inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customer read own status history or admin" on public.inquiry_status_history;
create policy "customer read own status history or admin" on public.inquiry_status_history for select to authenticated using (public.is_admin() or exists (select 1 from public.product_inquiries i where i.id = inquiry_id and i.user_id = (select auth.uid())));
drop policy if exists "admin manages status history" on public.inquiry_status_history;
create policy "admin manages status history" on public.inquiry_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "wishlist own rows" on public.wishlist_items;
create policy "wishlist own rows" on public.wishlist_items for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Storage setup: create public bucket `product-images` in Supabase Storage.
-- Add policies allowing public read and authenticated admin-only upload/update/delete.
-- Do not create an admin by changing client metadata. After signing up your own account,
-- promote it once from SQL Editor with: update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');
-- Replace YOUR_EMAIL with your own verified account email before running that one statement.
