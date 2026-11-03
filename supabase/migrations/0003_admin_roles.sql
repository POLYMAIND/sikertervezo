-- Sikermaker — superadmin jog kiosztása a felületről (a SUPERADMIN_EMAILS-ben lévő fő admin(ok) mellé).
-- Futtatás: Supabase SQL Editor (a 0002 után). Böngészőből nem érhető el (RLS, policy nélkül).
create table if not exists public.sikertervezo_superadmins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.sikertervezo_superadmins enable row level security;
