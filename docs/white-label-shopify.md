# White label márka előfizetéssel (Shopify + Appstle)

A márka gazdája (pl. Bea) a saját Shopify-boltjában árulja a tervező előfizetését; a fizetés és a számlázás
ott marad (Shopify, Stripe, Appstle). A Sikermaker csak azt tudja meg, **ki fizetett** — és csak őt engedi be.

```
Vevő fizet a Shopify-boltban (Appstle előfizetés, havonta új rendelés)
  → Shopify webhook „Rendelés kifizetése” (aláírt) → /api/shopify?brand=<slug>
     → ha a rendelésben ott a márka terméke: a vevő e-mail-címe 35 napig előfizető (kifizetéstől számítva)
     → levelet a Sikermaker nem küld: a teendőket (regisztráció a vásárlási címmel, belépés, kezdőképernyő)
       a bolt saját rendelés-visszaigazolója írja le; a regisztrációs link lehet előre kitöltött:
       https://<domain>/app?regisztracio&email={{ order.email }}
  Lemondás: nincs új rendelés → a hozzáférés a 35 nap végén magától lejár
  „Rendelés törlése” webhook → azonnal lejár (csak Shopify-ból jött tagnál)
```

**„Csak előfizetők” módban** (Admin → Márkák → a márka kártyája):
- belépni csak az aktív előfizető és a márka gazdája tud; mindenki más az „Előfizetek” gombot látja (a bolt linkje);
- nincs bemutató mód („Kipróbálom belépés nélkül”), mert az ingyenes hozzáférés lenne;
- a márka gazdája a **Márkám → Felhasználóim → Előfizetők** alatt látja a listát, kézzel is felvehet vagy
  hosszabbíthat valakit (pl. ajándék), és törölhet.

## Beállítás (egyszer, márkánként)

1. **Supabase:** `supabase/migrations/0012_brand_members.sql` lefuttatása (SQL Editor).
2. **Admin → Márkák → a márka:** „Csak előfizetők” be, bolt / termékoldal linkje, Shopify-termék azonosító
   (a termék admin-linkjének a végén lévő szám: `.../products/11059924828506`) → Mentés.
   Ezután a kártyán megjelenik a webhook címe.
3. **Shopify (a márka gazdája):** Beállítások → Értesítések → (lent) Webhookok → **Webhook létrehozása**:
   - Esemény: **Rendelés kifizetése**, formátum **JSON**, URL: `https://sikermaker.hu/api/shopify?brand=<slug>`
   - Még egy: **Rendelés törlése**, ugyanez az URL.
   - A lista alatt: „A webhookjaid ezzel lesznek aláírva: …” → ezt a kulcsot másold ki.
4. **Vercel:** `SHOPIFY_WEBHOOK_SECRETS` = `{"<slug>":"<a kimásolt kulcs>"}` (több márkánál vesszővel bővíthető),
   majd Redeploy.
5. **Shopify rendelés-visszaigazoló:** a terméknél (vagy feltételesen a sablonban) a 3 lépés: regisztráció a
   vásárláskor megadott címmel, belépés, kezdőképernyőre tétel.
6. **Próba:** a Shopify webhook-listában „Teszt értesítés küldése” → a Sikermaker Admin → Napló-ban
   `shopify.…` sor jelenik meg (a teszt-rendelés terméke nem a márkáé, ezért „ignored” — ez jó jel: az aláírás
   működik). Utána egy valódi (vagy 100%-os kuponos) próbavásárlás.

Megjegyzések:
- A vevőnek a Shopify-ban megadott e-mail-címmel kell belépnie (a zárolt képernyő ezt meg is mondja).
- Visszatérítésnél (részleges is) a márka gazdája kézzel törölheti a tagot a listából.
- Ha a webhook valamiért nem jut el, a márka gazdája kézzel felveheti a vevőt.
