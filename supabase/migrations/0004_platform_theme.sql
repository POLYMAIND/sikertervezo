-- Sikertervező — az app alap-arculata (a superadmin „Sikertervező-arculat" menüpontja). Egyetlen sor: id='default'.
-- Böngészőből nem érhető el (RLS, policy nélkül); a szerver olvassa (/api/config) és csak superadmin írja (/api/admin).
create table if not exists public.sikertervezo_platform (
  id         text primary key check (id = 'default'),
  config     jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.sikertervezo_platform enable row level security;
