-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Organizations & Profiles
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key,                                   -- = auth.users.id
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('admin','staff')),
  created_at timestamptz default now()
);

-- Items (includes basic sale fields)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  ai_description text,
  brand text,
  model text,
  year int check (year is null or year between 1800 and 2100),
  attrs jsonb default '{}'::jsonb,
  status text default 'draft' check (status in ('draft','published','sold')),
  start_price numeric(12,2),
  reserve_price numeric(12,2),
  hammer_price numeric(12,2),
  sold_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Images
create table if not exists public.item_images (
  id bigserial primary key,
  item_id uuid not null references public.items(id) on delete cascade,
  url text not null,
  position int default 1,
  created_at timestamptz default now()
);

-- Comparable sales (curated evidence per item)
create table if not exists public.comps (
  id bigserial primary key,
  item_id uuid not null references public.items(id) on delete cascade,
  source text not null,          -- 'ebay','shopgoodwill', etc.
  source_url text,
  sold_price numeric(12,2) not null check (sold_price >= 0),
  currency text default 'USD',
  sold_at date,
  notes text,
  created_at timestamptz default now()
);

-- Stored price suggestions
create table if not exists public.price_suggestions (
  id bigserial primary key,
  item_id uuid not null references public.items(id) on delete cascade,
  min_price numeric(12,2) not null check (min_price >= 0),
  max_price numeric(12,2) not null check (max_price >= min_price),
  method text default 'comps_median_90d',
  why text,
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists items_org_created_idx on public.items (org_id, created_at desc);
create index if not exists comps_item_idx on public.comps (item_id);
create index if not exists item_images_item_idx on public.item_images (item_id);
create index if not exists price_suggestions_item_idx on public.price_suggestions (item_id);
