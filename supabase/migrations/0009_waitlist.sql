-- Sikermaker — várólista + zárt regisztráció + letölthető ajándék (privát tárhely).
--
-- 1) sikertervezo_flags: üzemi kapcsolók (most: nyitva van-e a regisztráció). A superadmin állítja az Adminban.
-- 2) A regisztráció zárását az ADATBÁZIS kényszeríti ki (trigger az auth.users-en), nem csak a felület:
--    zárt állapotban új fiók semmilyen úton (signUp, belépő link ismeretlen címre, API) nem jön létre. Fail-closed:
--    ha nincs kapcsoló-sor, a regisztráció zárt.
-- 3) sikertervezo_waitlist: a feliratkozók. Böngészőből elérhetetlen (RLS, policy nélkül); a szerver írja/olvassa.
-- 4) letoltesek: PRIVÁT tárhely-vödör; a fájl csak rövid életű, aláírt linken át tölthető le (a szerver adja ki).

create table if not exists public.sikertervezo_flags (
  id          text primary key default 'default' check (id = 'default'),
  signup_open boolean not null default false,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);
alter table public.sikertervezo_flags enable row level security;
insert into public.sikertervezo_flags (id, signup_open) values ('default', false) on conflict (id) do nothing;

create table if not exists public.sikertervezo_waitlist (
  id          bigint generated always as identity primary key,
  email       text not null,
  source      text,
  consent_at  timestamptz not null,
  ip_hash     text,
  downloads   integer not null default 0,
  notified_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists sikertervezo_waitlist_email on public.sikertervezo_waitlist (lower(email));
create index if not exists sikertervezo_waitlist_ip_time on public.sikertervezo_waitlist (ip_hash, created_at desc);
alter table public.sikertervezo_waitlist enable row level security;

-- letöltésszámláló (a szerver hívja service-kulccsal; böngészőből nem hívható)
create or replace function public.sikertervezo_waitlist_download(p_email text)
returns void language sql security definer set search_path = public as $$
  update public.sikertervezo_waitlist set downloads = downloads + 1 where lower(email) = lower(p_email);
$$;
revoke all on function public.sikertervezo_waitlist_download(text) from public, anon, authenticated;

-- a regisztráció kapuja
create or replace function public.sikertervezo_signup_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select signup_open from public.sikertervezo_flags where id = 'default'), false) then
    raise exception 'signup_closed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.sikertervezo_signup_gate() from public, anon, authenticated;
drop trigger if exists sikertervezo_signup_gate on auth.users;
create trigger sikertervezo_signup_gate before insert on auth.users
  for each row execute function public.sikertervezo_signup_gate();

-- privát vödör a letölthető anyagoknak (pl. letoltesek/kaoszmanager.pdf)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('letoltesek', 'letoltesek', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;
