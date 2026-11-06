-- Sikermaker — a várólista feliratkozóinak átküldése a PolyOS CRM-be (api/_leads.js).
-- polyos_synced_at: mikor vette át a PolyOS; null = még nincs átküldve (az Admin → Várólista gombja pótolja).
alter table public.sikertervezo_waitlist add column if not exists polyos_synced_at timestamptz;
create index if not exists sikertervezo_waitlist_polyos_pending on public.sikertervezo_waitlist (id) where polyos_synced_at is null;
