-- Sikermaker — nyitás időpontja (visszaszámláló). A regisztráció nyitva van, ha signup_open = true, VAGY elérkezett
-- a launch_at időpont (automatikus nyitás). Az Adminban állítható; lezáráskor a már elmúlt launch_at törlődik.
alter table public.sikertervezo_flags add column if not exists launch_at timestamptz;
update public.sikertervezo_flags set launch_at = '2026-11-07 10:00:00+01' where id = 'default' and launch_at is null;

create or replace function public.sikertervezo_signup_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare f record;
begin
  select signup_open, launch_at into f from public.sikertervezo_flags where id = 'default';
  if not coalesce(f.signup_open, false) and not coalesce(f.launch_at <= now(), false) then
    raise exception 'signup_closed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.sikertervezo_signup_gate() from public, anon, authenticated;
