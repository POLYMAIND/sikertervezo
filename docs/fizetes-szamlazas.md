# Pro előfizetés: Stripe-fizetés + Számlázz.hu-számla

```
„Pro-ra váltok” → /api/billing (Stripe Checkout: kártya, számlázási cím, cégnek adószám)
Stripe ──webhook──▶ /api/stripe-webhook
   checkout.session.completed, customer.subscription.*  → sikertervezo_subscriptions (Pro be/ki)
   invoice.paid (első hónap + minden megújulás)          → api/_szamlazz.js → Számlázz.hu Számla Agent
                                                           → kifizetett e-számla, a Számlázz.hu e-mailben küldi a vevőnek
```

- **Nincs dupla számla:** a Stripe-számla azonosítója (`in_…`) egyedi kulcs a `sikertervezo_invoices` táblában.
- **Átmeneti Számlázz.hu-hiba** (hálózat, 5xx): a webhook 500-zal válaszol, a Stripe újrapróbálja.
- **Adathiba** (pl. hibás cím): nem próbálja újra; az Admin → Napló mutatja (`szamlazz.error`), a
  számlát kézzel kell kiállítani a Számlázz.hu-ban. Sikeres számla: `szamlazz.ok` a számlaszámmal.
- 0 Ft-os fizetésre (100%-os kupon) nincs számla.

## Beállítás

1. **Supabase:** `supabase/migrations/0011_invoices.sql` (enélkül nem készül számla, csak naplóbejegyzés).
2. **Stripe:**
   - Termék „Sikermaker Pro”, havi ismétlődő ár (1 990 Ft) → `STRIPE_PRICE_ID`.
   - Webhook: `https://sikermaker.hu/api/stripe-webhook`, események: `checkout.session.completed`,
     `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`,
     **`invoice.paid`** → `STRIPE_WEBHOOK_SECRET`.
   - Ügyfélportál bekapcsolása (kártya, számlák, lemondás).
   - Javasolt: Beállítások → Ügyfél-e-mailek → a Stripe „sikeres fizetés” nyugtáját kikapcsolni, hogy a vevő
     csak a Számlázz.hu-számlát kapja.
3. **Számlázz.hu:** Beállítások → Számla Agent kulcs → `SZAMLAZZ_AGENT_KEY`. A cég adatai, bankszámla és logó
   a Számlázz.hu-fiókban vannak (onnan kerülnek a számlára).
4. **Vercel (Production):** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SZAMLAZZ_AGENT_KEY`,
   és ha nem 27%: `SZAMLAZZ_AFAKULCS` (alanyi adómentesnél `AAM`). Opcionális: `SZAMLAZZ_ELOTAG`, `SZAMLAZZ_REPLYTO`,
   `SZAMLAZZ_TETEL_NEV`. Utána újratelepítés.
5. **Ellenőrzés:** `/api/health` → `stripe: true`, `szamlazz: true`, `tables.sikertervezo_invoices: true`.
   Próbavásárlás → a Számlázz.hu-ban megjelenik a számla, a vevő megkapja e-mailben → lemondás a portálon.
