# Sikermaker ↔ PolyOS integráció

A Sikermaker önálló app (saját Vercel-projekt, saját Supabase), ami a PolyOS **alapmodulja**: innen vezetjük
tovább a felhasználót a PolyOS Naptár, Foglalás, CRM, Feladatkezelő, Cashflow és Kampánytervező moduljába.

Ez a dokumentum a **PolyOS-oldali szerződés**: mit kell a PolyOS-ben megépíteni, hogy a tervező oldala (ez a repó,
`api/polyos.js`, `api/polyos-callback.js`, `api/_polyos.js`) élesben működjön. Addig a tervező a
`POLYOS_MOCK=1` fejlesztői szimulációval próbálható ki (élesben a mock nem kapcsolható be).

## Alapelvek (a PolyOS `CLAUDE.md` vasszabályai szerint)

- **Felhasználónkénti összekapcsolás, nincs közös token.** Minden tervező-felhasználó a *saját* PolyOS-fiókját
  köti össze, és a PolyOS-ben ő választja ki, melyik fiókba (tenant) kerüljön az adat. Telepítés-szintű „mindenki
  ugyanabba a fiókba ír" token nincs, mert átengedné a fiókhatárt.
- **A token sosem kerül a böngészőbe.** A tervező szervere titkosítva (AES-256-GCM) tárolja, a böngésző a saját
  `/api/polyos` végpontunkat hívja.
- **Az átküldés mindig a felhasználó kattintására történik.** Nincs háttérszinkron, nincs tömeges import.
- **Modul-jogosultság a PolyOS-ben dől el.** A tervező csak megjeleníti, a PolyOS-oldal minden íráskor újra ellenőrzi
  (`requireModuleAccess`).

## A folyamat

```
Tervező (böngésző)          Tervező szerver (/api)                    PolyOS
──────────────────          ──────────────────────                    ──────
„Összekapcsolás"  ──POST /api/polyos {connect}──▶ nonce (10 perc, a userhez kötve)
                  ◀── url ─────────────────────
böngésző ───────────────────────────────────────────────────────────▶ GET /connect/sikermaker?client_id&redirect_uri&state&scope&login_hint
                                                                         (belépés, tenant/egység választás, jóváhagyás)
                            GET /api/polyos-callback?code&state ◀──── 302 redirect_uri?code&state
                            POST /api/v1/sikermaker/token ─────────▶ code → access_token (+ tenant, modules)
                            token titkosítva a sikertervezo_polyos_links-be
böngésző ◀── 302 /?polyos=ok#bovitesek
„↗ Küldés"        ──POST /api/polyos {push}────▶ POST /api/v1/sikermaker/items ─▶ upsert a megfelelő modulba
```

## A PolyOS-ben megépítendő végpontok

Minden végpont serverless (Vercel), a meglévő `_access.js` / `_audit.js` / `_tenant.js` segédekkel.

### 1. `GET /connect/sikermaker` — engedélykérő oldal (UI)

Paraméterek: `client_id`, `redirect_uri`, `state`, `scope` (`items:write profile:read`), `login_hint` (e-mail, előtöltéshez).

- Ha a felhasználó nincs belépve: belépés, vagy **regisztráció előtöltött e-maillel** (ez az upsell-tölcsér belépője).
- Kiválasztja a tenantot (és ha van, az egységet), jóváhagy.
- A `redirect_uri` **pontosan egyezzen** a klienshez regisztrált címmel (nyílt átirányítás ellen).
- Egyszer használatos, ~5 percig élő `code`-ot ad, 302 → `redirect_uri?code=…&state=…`. Elutasításnál `?error=access_denied&state=…`.

### 2. `POST /api/v1/sikermaker/token`

```json
{ "grant_type": "authorization_code", "code": "…", "client_id": "…", "client_secret": "…", "redirect_uri": "…" }
```
Válasz:
```json
{ "access_token": "…", "token_type": "Bearer", "scope": "items:write profile:read",
  "tenant": { "id": "…", "name": "Minta Kft." }, "modules": ["crm", "projects", "calendar"] }
```
- A token a (tenant, user, client) hármashoz kötött, visszavonható. Tárolás hash-elve, RLS mögött.
- `modules`: a tenant **csomagja ÉS a user jogosultsága** szerint ténylegesen használható modulok (ugyanaz a metszet,
  amit az `_access.js` `modulesFor` ad), az `api/_modules.js` kulcsaival: `crm`, `calendar`, `bookings`, `projects`, `cashflow`, `campaign`.

### 3. `GET /api/v1/sikermaker/me` (Bearer)

`{ "tenant": { "id": "…", "name": "…" }, "modules": [ … ] }` — a tervező 10 percenként frissíti vele a modul-listát.
Visszavont tokenre **401** (a tervező ekkor törli a kapcsolatot).

### 4. `POST /api/v1/sikermaker/items` (Bearer) — átküldés

```json
{ "kind": "contact", "module": "crm", "external_id": "k3x9a2b", "data": { "name": "Minta Anna", "stage": "Beszélgetés" } }
```
Válasz: `{ "id": "<a PolyOS-rekord azonosítója>", "url": "https://www.polyos.hu/crm?..." }` (az `url` opcionális).

- **Idempotens upsert** a `(tenant_id, user_id, kind, external_id)` kulcsra: ugyanaz az elem újraküldve frissít, nem duplikál.
- `requireModuleAccess(req, module)` → **403**, ha a modul nincs a csomagban / jogosultságban.
- Explicit `tenant_id`-szűrés a service-kulcsos írásnál; append-only audit (`_audit.js` `logReq`).
- A `data` mezőit a PolyOS is validálja (a tervező már whitelistel, lásd lent).

| `kind` | modul | `data` mezők | hová kerül a PolyOS-ben (javaslat) |
|---|---|---|---|
| `contact` | `crm` | `name`*, `source`, `interest`, `stage`, `next_step`, `next_date`, `note` | CRM-kontakt (lead), a `stage` a pipeline-lépcső |
| `client` | `crm` | `name`*, `phone`, `birthday` (HH-NN), `favorites`, `address`, `last_order`, `reorder_cycle_days` | CRM-kontakt (ügyfél típus) |
| `task` | `projects` | `title`*, `due_date`, `done` | feladat a feladatkezelőben (`/api/omnio-task` útvonalon, **nem** a relációs `public.tasks`-ba; lásd PolyOS GOTCHA) |
| `event` | `calendar` | `title`*, `date`*, `start`, `end` (ÓÓ:PP), `location` | naptáresemény |
| `content` | `campaign` | `title`*, `date`, `time`, `pillar`, `format`, `status` | kampány-/tartalomvázlat |
| `idea` | `campaign` | `pillar`, `hook`*, `main`, `cta` | kampányötlet |
| `order` | `cashflow` | `date`*, `amount`*, `currency`, `client`, `items`, `paid` | bevételi tétel |

`*` = kötelező. A dátum `ÉÉÉÉ-HH-NN`.

### 5. `POST /api/v1/sikermaker/revoke` (Bearer)

A token érvénytelenítése (a tervező „Leválasztás" gombja hívja). A PolyOS-ben a felhasználónak is legyen
„Összekapcsolt alkalmazások" listája, ahonnan maga is visszavonhatja.


### 6. `POST /api/v1/leads` — a Sikermaker várólistájának feliratkozói (szerver → szerver)

Ez **nem** a felhasználónkénti összekapcsolás: egyetlen, titkos kulccsal védett csatorna, amin a Sikermaker a
várólistára feliratkozókat lead-ként a **Polymaind saját PolyOS-fiókjának** CRM-jébe küldi (`api/_leads.js`).

```
POST /api/v1/leads
Authorization: Bearer <POLYOS_LEADS_KEY>
X-Polyos-Client: sikermaker
{ "email": "anna@pelda.hu", "source": "landing", "tags": ["sikermaker-varolista"],
  "consent_at": "2026-11-06T10:00:00Z", "subscribed_at": "2026-11-06T10:00:00Z",
  "external_id": "sikermaker-waitlist:42" }
```
Válasz: bármilyen `2xx` (pl. `{ "id": "…" }`). Minden más (vagy 4 mp-en túli válasz) = sikertelen; a Sikermaker
később újrapróbálja (Admin → Várólista → „Átküldés a PolyOS-be”).

- A kulcs a PolyOS-ben **egy fix tenanthoz** (Polymaind) kötött; a tenant a kulcsból jön, sosem a kérésből.
  Kulcs összehasonlítása időzítés-biztosan (`timingSafeEqual`), tárolás hash-elve / env-ben.
- **Idempotens upsert** a `(tenant_id, lower(email))` kulcsra: újraküldve nem duplikál, a `tags`-et összefésüli.
- CRM-kontakt lead típussal, pipeline-lépcső: az első (pl. „Új”), forrás: `source`, címke: `sikermaker-varolista`.
- A `consent_at` a hozzájárulás időpontja (GDPR-nyilvántartás). Append-only audit (`logReq`).
- Bemenet-validálás: e-mail formátum, max 254 karakter; ismeretlen mezők eldobva.

## A tervező oldalán szükséges beállítások

| Változó | Honnan |
|---|---|
| `POLYOS_API_BASE` | a PolyOS API címe |
| `POLYOS_PUBLIC_URL` | `https://www.polyos.hu` |
| `POLYOS_CLIENT_ID`, `POLYOS_CLIENT_SECRET` | a PolyOS-ben regisztrált „sikertervezo" kliens |
| `LINK_ENC_KEY` | `openssl rand -base64 32` |
| `POLYOS_LEADS_URL` | a 6. pont végpontja, pl. `https://www.polyos.hu/api/v1/leads` |
| `POLYOS_LEADS_KEY` | a PolyOS-ben a Polymaind-tenanthoz kiadott titkos kulcs (`openssl rand -base64 32`) |
| `APP_URL` | a tervező címe; a PolyOS-kliensnél a `redirect_uri` = `APP_URL/api/polyos-callback` |

## Upsell-linkek

Ha a felhasználónál nincs meg egy modul, a „Kipróbálom” gomb a PolyOS modul-oldalára visz:
`https://www.polyos.hu/modulok/<oldal>?ref=sikermaker&partner=<márka-slug>`
(crm → `crm`, calendar → `naptar`, bookings → `foglalas`, projects → `feladatkezelo`, campaign → `kampanytervezes`;
a cashflow-nak nincs külön oldala, az a `/modulok` áttekintőre visz). A `partner` a white label márkát azonosítja.
A white label csomag iránti érdeklődés: `https://www.polyos.hu/kapcsolat?ref=sikermaker&tema=whitelabel`.

**Fontos:** a PolyOS árazási dokumentációja jelenleg azt írja, hogy *„nincs white-label"*. Ez a Sikermakerre
nem igaz: ott a white label külön értékesített csomag. A PolyOS-oldali árazó oldalra és a `modular-pricing` doksiba
ezt fel kell venni.
