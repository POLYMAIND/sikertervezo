# Sikertervező

Napi tervező vállalkozóknak (lépések, kapcsolatok, ügyfelek, tartalom, csapat, célok, szokások, olvasás, gondolattérkép,
matricák), a **PolyOS alapmodulja**: innen vezetjük tovább a felhasználót a PolyOS Naptár, Foglalás, CRM,
Feladatkezelő, Cashflow és Kampánytervező moduljába.

Az egyik ügyfelünknek készült, egyfájlos prototípusból épült: a funkciók megmaradtak, az arculat semlegessé vált,
a foglalási rendszer kikerült (az a PolyOS Foglalás modulja), és kapott fiókot, felhőmentést, két csomagot és PolyOS-hidat.

## Csomagok

| | **Alap** | **White label** |
|---|---|---|
| Kinézet | semleges alaparculat | a márka saját neve, logója, kiemelőszíne, kiemelés-színe, oldalsávja, betűpárja |
| Amit a felhasználó állít | háttér (minta + szín) | háttér (minta + szín) |
| Amit a márka gazdája állít | – | Beállítások → Márka (white label): név, alcím, aláírás, logó, színek, betűk, alapító tagsági program, saját idézetek |
| Oklevél aláírása | a tervező neve | a márka gazdája |
| PolyOS-bővítések | igen | igen (márkánként kikapcsolható: `upsell`) |

A csomagot **a szerver** dönti el (`api/_brands.js`): alap csomagnál a white label mezők ki sem mennek a böngészőnek,
a `plan` mezőt pedig a márka-admin sem tudja átírni (csak a Polymaind, az adatbázisban).

Bemutató módban (belépés nélkül) a Beállítások alján a két csomag között váltani lehet. Ez csak a kinézetet mutatja
meg, a szerveren semmit nem enged. Kitalált white label minta: `?brand=minta-marka`.

## Felépítés

```
public/                 statikus frontend (build nélkül, vanilla JS)
  index.html
  css/app.css           minden szín/betű/háttér CSS-változó (tokenek) — konkrét színkód NEM kerülhet bele
  js/theme.js           csomag-szabály + tokenek + paletta (matricák, érmek, oklevél is ebből színeződik)
  js/store.js           Supabase Auth + terv-mentés (verzió-ellenőrzéssel), bemutató módban localStorage
  js/polyos.js          PolyOS-modulkatalógus, upsell-linkek, átküldés (a saját /api-nkon át)
  js/app.js             a tervező: nézetek és események
  js/boot.js            indítás, belépés, regisztráció, elfelejtett jelszó
api/                    Vercel serverless függvények
  config.js             GET  márka + csomag + nyilvános beállítások
  brand.js              GET/PUT white label márka mentése (csak márka-admin)
  polyos.js             POST status / connect / disconnect / push
  polyos-callback.js    GET  a PolyOS-engedélyezés visszahívása
supabase/migrations/    adatbázis-séma (RLS)
brands/                 kitalált minta-márkák (valós ügyfél-arculat NEM kerül a repóba)
docs/polyos-integracio.md   a PolyOS-oldali szerződés
tests/                  egységtesztek, böngészős füstteszt, helyi fejlesztői szerver
```

## Helyi futtatás

```bash
POLYOS_MOCK=1 node tests/devserver.mjs 3000
```
Megnyitás: http://localhost:3000. Környezeti változók nélkül **bemutató módban** fut (mintaadatok, a böngészőben marad);
`POLYOS_MOCK=1`-gyel a PolyOS-átküldés szimulálva kipróbálható. Vercel CLI-vel: `vercel dev`.

```bash
npm test
```

```bash
node tests/smoke.mjs http://localhost:3000
```

## Élesítés

1. **Supabase:** új projekt (EU-régió). SQL Editor → `supabase/migrations/0001_sikertervezo.sql`.
   Auth → URL Configuration: Site URL = az app címe, Redirect URLs-be is. E-mail sablonok magyarul.
2. **Vercel:** új projekt erre a repóra, a változók a `.env.example` szerint (`SUPABASE_*`, `APP_URL`, `TERMS_URL`, `PRIVACY_URL`).
3. **White label ügyfél:** sor a `sikertervezo_brands` táblába (`plan='whitelabel'`), az admin(ok) a
   `sikertervezo_brand_admins`-ba; saját domainhez `BRAND_HOSTS`. Az arculatot ezután az admin maga állítja be a felületen.
4. **PolyOS-híd:** a `docs/polyos-integracio.md` szerinti végpontok a PolyOS-ben, majd a `POLYOS_*` és `LINK_ENC_KEY` változók.

## Biztonság röviden

- Titkos kulcs (service role, PolyOS client secret, titkosító kulcs) csak a szerver-oldali függvényekben él; a
  Supabase anon kulcs nyilvános, a védelem az RLS (mindenki csak a saját tervét éri el).
- A márka-, kapcsolat- és nonce-táblák böngészőből elérhetetlenek (RLS, policy nélkül); a szerver explicit
  `user_id` / `slug` szűréssel írja és olvassa őket.
- A PolyOS-token felhasználónként, titkosítva tárolódik; a mock élesben nem kapcsolható be (fail-closed).
- A PolyOS felé csak whitelistelt mezők mennek (`api/_polyos.js` `SCHEMA`), az átküldés mindig a felhasználó kattintására.
- Szigorú CSP és biztonsági fejlécek: `vercel.json`.
