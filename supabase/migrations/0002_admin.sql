-- Sikermaker — superadmin: előfizetések + megmásíthatatlan admin-napló.
-- Futtatás: Supabase SQL Editor (a 0001 után). Böngészőből egyik tábla sem érhető el (RLS, policy nélkül);
-- csak a szerver-oldali /api/admin végpont írja-olvassa service kulccsal, superadmin-ellenőrzés után.

create table if not exists public.sikertervezo_subscriptions (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  plan               text not null default 'ingyenes' check (plan in ('ingyenes','alap','whitelabel')),
  status             text not null default 'probaido' check (status in ('probaido','aktiv','lejart','lemondva','ajandek')),
  current_period_end date,
  note               text,
  updated_by         uuid references auth.users(id) on delete set null,
  updated_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
alter table public.sikertervezo_subscriptions enable row level security;

-- Admin-napló: csak hozzáfűzni lehet (módosítás és törlés tiltva, a service kulccsal is).
create table if not exists public.sikertervezo_audit (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor_id   uuid,
  actor_email text,
  action     text not null,
  target     text,
  detail     jsonb not null default '{}'::jsonb
);
alter table public.sikertervezo_audit enable row level security;
create or replace function public.sikertervezo_audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'sikertervezo_audit is append-only'; end $$;
drop trigger if exists sikertervezo_audit_no_change on public.sikertervezo_audit;
create trigger sikertervezo_audit_no_change before update or delete on public.sikertervezo_audit
  for each row execute function public.sikertervezo_audit_immutable();
create index if not exists sikertervezo_audit_at on public.sikertervezo_audit (at desc);
