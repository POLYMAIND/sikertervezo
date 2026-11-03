-- Sikertervező — bekötött külső naptárak (Google / iCloud / Outlook iCal-link). A link titkosítva (a privát link jelszóként működik).
-- Böngészőből nem érhető el (RLS, policy nélkül).
create table if not exists public.sikertervezo_cal_imports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3E7BFA',
  url_enc     text not null,
  host        text,
  last_ok_at  timestamptz,
  last_error  text,
  created_at  timestamptz not null default now()
);
create index if not exists sikertervezo_cal_imports_user on public.sikertervezo_cal_imports (user_id);
alter table public.sikertervezo_cal_imports enable row level security;
