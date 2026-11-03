-- Sikermaker — alapséma. Külön (saját) Supabase-projektbe való; minden tábla `sikertervezo_` előtagú,
-- így közös projektben is ütközésmentes. Futtatás: Supabase SQL Editor, vagy `supabase db push`.
--
-- Hozzáférési elv:
--   * a terv (sikertervezo_state): a felhasználó CSAK a saját sorát éri el (RLS, auth.uid()).
--   * márkák, márka-adminok, PolyOS-kapcsolatok, nonce-ok: a böngészőből SEMMI (RLS bekapcsolva, policy nélkül);
--     csak a szerver-oldali /api függvények érik el service kulccsal, explicit user_id/slug szűréssel.

-- ---------- márkák (csomag + white label beállítás) ----------
create table if not exists public.sikertervezo_brands (
  slug        text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  plan        text not null default 'alap' check (plan in ('alap','whitelabel')),
  config      jsonb not null default '{}'::jsonb,   -- név, logó, színek, betűk, alapító program, idézetek
  upsell      boolean not null default true,         -- mutatjuk-e a PolyOS-bővítéseket
  polyos_partner text,                               -- (opcionális) a PolyOS-partner azonosítója az ajánlói linkhez
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);
alter table public.sikertervezo_brands enable row level security;
insert into public.sikertervezo_brands (slug, plan) values ('alap', 'alap') on conflict (slug) do nothing;

-- ---------- márka-adminok (white label: ki szerkesztheti a márkát) ----------
create table if not exists public.sikertervezo_brand_admins (
  slug     text not null references public.sikertervezo_brands(slug) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (slug, user_id)
);
alter table public.sikertervezo_brand_admins enable row level security;

-- ---------- a felhasználó terve ----------
create table if not exists public.sikertervezo_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  brand_slug text not null default 'alap',
  data       jsonb not null default '{}'::jsonb,
  version    integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, brand_slug),
  constraint sikertervezo_state_size check (pg_column_size(data) < 5000000)
);
alter table public.sikertervezo_state enable row level security;
drop policy if exists "sajat terv olvasasa" on public.sikertervezo_state;
create policy "sajat terv olvasasa" on public.sikertervezo_state for select using (auth.uid() = user_id);
drop policy if exists "sajat terv torlese" on public.sikertervezo_state;
create policy "sajat terv torlese" on public.sikertervezo_state for delete using (auth.uid() = user_id);
-- írás CSAK a lenti függvényen át (verzió-ellenőrzéssel), közvetlen insert/update policy nincs.

-- Mentés optimista zárolással: ha egy másik eszköz közben mentett, nem írjuk felül, hanem jelezzük.
create or replace function public.sikertervezo_save(p_brand text, p_data jsonb, p_version integer)
returns table (version integer, conflict boolean)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cur integer;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_brand !~ '^[a-z0-9][a-z0-9-]{0,39}$' then raise exception 'bad_brand'; end if;
  select s.version into cur from public.sikertervezo_state s where s.user_id = uid and s.brand_slug = p_brand for update;
  if cur is null then
    insert into public.sikertervezo_state (user_id, brand_slug, data, version) values (uid, p_brand, p_data, 1);
    return query select 1, false;
  elsif cur <> p_version then
    return query select cur, true;
  else
    update public.sikertervezo_state s set data = p_data, version = cur + 1, updated_at = now() where s.user_id = uid and s.brand_slug = p_brand;
    return query select cur + 1, false;
  end if;
end $$;
revoke all on function public.sikertervezo_save(text, jsonb, integer) from public, anon;
grant execute on function public.sikertervezo_save(text, jsonb, integer) to authenticated;

-- ---------- PolyOS-kapcsolatok (a token titkosítva; böngészőből nem érhető el) ----------
create table if not exists public.sikertervezo_polyos_links (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  access_token_enc   text not null,
  polyos_tenant_id   text,
  tenant_name        text,
  scopes             text,
  modules            jsonb not null default '[]'::jsonb,
  modules_checked_at timestamptz,
  created_at         timestamptz not null default now()
);
alter table public.sikertervezo_polyos_links enable row level security;

create table if not exists public.sikertervezo_polyos_nonces (
  nonce      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  return_to  text not null default '/',
  created_at timestamptz not null default now()
);
alter table public.sikertervezo_polyos_nonces enable row level security;
create index if not exists sikertervezo_polyos_nonces_created on public.sikertervezo_polyos_nonces (created_at);
