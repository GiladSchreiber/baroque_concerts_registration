-- Run this if you already ran schema.sql (adds the new columns)
-- If setting up fresh, run schema.sql instead (it already includes these)

alter table public.concerts
  add column if not exists band_name text not null default '',
  add column if not exists artists   jsonb not null default '[]'::jsonb;
