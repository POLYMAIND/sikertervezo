-- Sikermaker — Számlázz.hu számlák (api/_szamlazz.js). Egy Stripe-számla (in_…) = legfeljebb egy magyar számla.
-- A stripe_invoice_id egyedi kulcsa védi a dupla kiállítást (webhook-újrapróbálkozás, párhuzamos kézbesítés).
-- Böngészőből elérhetetlen (RLS, policy nélkül); a szerver írja/olvassa a service kulccsal.
create table if not exists public.sikertervezo_invoices (
  id                bigint generated always as identity primary key,
  stripe_invoice_id text not null unique,
  user_id           uuid,
  email             text,
  amount            numeric(12,2) not null,
  currency          text not null default 'HUF',
  status            text not null default 'pending' check (status in ('pending', 'kesz', 'failed')),
  szamlaszam        text,
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists sikertervezo_invoices_user on public.sikertervezo_invoices (user_id, created_at desc);
alter table public.sikertervezo_invoices enable row level security;
