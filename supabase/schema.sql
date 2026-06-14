-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- CONCERTS
-- ─────────────────────────────────────────
create table public.concerts (
  id            uuid        default uuid_generate_v4() primary key,
  band_name     text        not null default '',
  artists       jsonb       not null default '[]'::jsonb,
  title_en      text        not null,
  title_he      text        not null,
  date          timestamptz not null,
  location_en   text        not null default '',
  location_he   text        not null default '',
  description_en text       not null default '',
  description_he text       not null default '',
  details_en    text        not null default '',   -- "how it works" body (optional)
  details_he    text        not null default '',
  capacity      integer     not null default 100,
  price_nis     integer     not null default 0,
  poster_url    text,
  is_active     boolean     not null default true,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────
-- REGISTRATIONS
-- ─────────────────────────────────────────
create table public.registrations (
  id            uuid        default uuid_generate_v4() primary key,
  concert_id    uuid        references public.concerts(id) on delete cascade not null,
  full_name     text        not null,
  phone         text        not null,
  email         text        not null,
  spots         integer     not null default 1 check (spots >= 1 and spots <= 4),
  checked_in    boolean     not null default false,
  checked_in_at timestamptz,
  on_waitlist   boolean     not null default false,
  created_at    timestamptz default now()
);

-- Index for fast capacity checks
create index registrations_concert_id_idx on public.registrations (concert_id);

-- ─────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.concerts      enable row level security;
alter table public.registrations enable row level security;

-- Anyone can read active concerts
create policy "Public can read active concerts"
  on public.concerts for select
  using (is_active = true);

-- Anyone can register (insert)
create policy "Public can insert registrations"
  on public.registrations for insert
  with check (true);

-- Anyone can read a registration (needed for confirmation page)
create policy "Public can read registrations"
  on public.registrations for select
  using (true);

-- Service role (used server-side) bypasses RLS automatically

-- ─────────────────────────────────────────
-- STORAGE: concert-posters bucket
-- ─────────────────────────────────────────
-- Run this separately OR create the bucket manually in the Supabase dashboard:
-- Storage → New Bucket → Name: concert-posters → Public: true
--
-- insert into storage.buckets (id, name, public)
-- values ('concert-posters', 'concert-posters', true)
-- on conflict do nothing;

-- ─────────────────────────────────────────
-- SAMPLE CONCERT (edit to taste)
-- ─────────────────────────────────────────
insert into public.concerts (
  title_en, title_he,
  date,
  location_en, location_he,
  description_en, description_he,
  capacity, price_nis,
  is_active
) values (
  'Vivaldi — The Four Seasons',
  'וויוולדי — ארבע העונות',
  (now() + interval '30 days')::timestamptz,
  'Tel Aviv Museum of Art, Recanati Auditorium',
  'מוזיאון תל אביב לאמנות, אודיטוריום רקנאטי',
  'An intimate chamber performance of Vivaldi''s iconic Four Seasons, performed on period instruments.',
  'הופעת תזמורת צלילים אינטימית של ארבע העונות המפורסמות של וויוולדי, בנגינה על כלים מוקדמים.',
  80, 120,
  true
);
