-- Sikertervező — Pro e-mail napló (napi limit) + Stripe-azonosítók az előfizetéshez.
create table if not exists public.sikertervezo_email_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  to_domain  text,
  kind       text,
  status     text not null,
  created_at timestamptz not null default now()
);
create index if not exists sikertervezo_email_log_user_day on public.sikertervezo_email_log (user_id, created_at desc);
alter table public.sikertervezo_email_log enable row level security;

alter table public.sikertervezo_subscriptions add column if not exists stripe_customer_id text;
alter table public.sikertervezo_subscriptions add column if not exists stripe_subscription_id text;
create index if not exists sikertervezo_subscriptions_stripe_sub on public.sikertervezo_subscriptions (stripe_subscription_id);
