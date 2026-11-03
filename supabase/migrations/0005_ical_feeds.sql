-- Sikertervező — naptár-feliratkozó linkek (Google Naptár, iPhone Naptár). A linkből csak a SHA-256 hash-t tároljuk.
-- Böngészőből nem érhető el (RLS, policy nélkül).
create table if not exists public.sikertervezo_ical_feeds (
  token_hash    text primary key,
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  brand_slug    text not null default 'alap',
  created_at    timestamptz not null default now(),
  last_fetch_at timestamptz
);
alter table public.sikertervezo_ical_feeds enable row level security;
