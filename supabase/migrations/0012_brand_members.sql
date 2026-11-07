-- Sikermaker — white label márka előfizetői („csak előfizetők” hozzáférési mód).
-- Egy sor = egy e-mail-cím hozzáférése egy márkához, active_until-ig. Forrás: shopify (webhook) vagy kezi (a márka
-- gazdája / superadmin). Böngészőből elérhetetlen (RLS, policy nélkül); a szerver írja/olvassa a service kulccsal.
create table if not exists public.sikertervezo_brand_members (
  slug         text not null references public.sikertervezo_brands(slug) on delete cascade,
  email        text not null check (email = lower(email)),
  active_until timestamptz not null,
  source       text not null default 'kezi' check (source in ('shopify', 'kezi')),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (slug, email)
);
alter table public.sikertervezo_brand_members enable row level security;
