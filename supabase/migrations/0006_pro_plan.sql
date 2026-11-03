-- Sikermaker — csomagok: ingyenes / pro (3 999 Ft/hó). A white label márka-szintű (sikertervezo_brands.plan).
alter table public.sikertervezo_subscriptions drop constraint if exists sikertervezo_subscriptions_plan_check;
update public.sikertervezo_subscriptions set plan = 'pro' where plan in ('alap', 'whitelabel');
alter table public.sikertervezo_subscriptions add constraint sikertervezo_subscriptions_plan_check check (plan in ('ingyenes', 'pro'));
