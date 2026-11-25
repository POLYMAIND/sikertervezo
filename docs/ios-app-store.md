# Sikermaker iPhone-app: App Store-kiadás

Az app a `mobile/` mappában van (Capacitor 8). A `public/` mappa appnak szóló része **az appba csomagolva** fut, az API
pedig a `https://sikermaker.hu/api`-n. A webes és az appos változat ugyanaz a kód. A `public/js/native.js` csak az
appban kapcsol be.

| Mi | Hol |
|---|---|
| Webes tartalom → `mobile/www` | `mobile/scripts/build-www.mjs` (`npm run www`) |
| Xcode-projekt | `mobile/ios/App` (bundle ID `hu.sikermaker.app`, csak iPhone, iOS 15+) |
| Build + TestFlight Mac nélkül | `.github/workflows/ios-testflight.yml` + `mobile/fastlane/Fastfile` |
| Universal link (belépő levelek) | `api/aasa.js` → `/.well-known/apple-app-site-association` |
| Saját fiók törlése | `DELETE /api/me` (`api/_deleteuser.js`), Beállítások → Fiók → „Fiókom törlése” |

## Mit csinál másképp az app (App Store-szabályok)

- **Nincs vásárlás és vásárlásra utalás (3.1.1 / 3.1.3).** Nincs ár, nincs „Pro-ra váltok” gomb, Stripe vagy
  Stripe-portál, bolt-link, PolyOS- vagy white label-ajánló. Az ingyenes felhasználó **nem is látja** a Pro menüpontokat.
  Aki a weben fizetett, belépve itt is megkapja a Pro-t.
- **Nincs mérés.** Nincs GA4, Meta Pixel, Vercel Analytics és sütisáv, ezért nem kell követési engedélyt kérő ablak
  (ATT), és az adatvédelmi címke rövid.
- **Natív funkciók (4.2-es szabály, „ne csak egy weboldal legyen”):**
  - a Beállítások → Emlékeztetők valódi értesítést küld: reggeli összefoglaló a mai időpontokkal, teendőkkel,
    utánkövetésekkel és születésnapokkal, valamint esti zárás; 7 napra előre, minden mentéskor újraszámolva;
  - rezgéses visszajelzés a lépések kipipálásakor;
  - az állapotsor színe a márkához igazodik;
  - a belépős levelek linkje az appot nyitja meg;
  - a jelszót az iCloud-kulcskarika automatikusan kitölti (webcredentials).
- **Fióktörlés az appban (5.1.1(v)).** A fiók végleges törlése a saját e-mail-cím beírásával. A futó Stripe-előfizetést
  is azonnal lemondja.

## Egyszeri beállítás (ezt nektek kell)

### 1. Apple Developer (developer.apple.com)
1. **Membership** → jegyezd fel a **Team ID**-t (10 karakter).
2. Az App ID-t nem kell kézzel létrehozni: az első felhőbuild automatikusan regisztrálja (`hu.sikermaker.app`,
   Associated Domains képességgel).

### 2. App Store Connect (appstoreconnect.apple.com)
1. **Apps → + → New App:**
   - platform: iOS;
   - név: **Sikermaker**;
   - elsődleges nyelv: **Hungarian**;
   - bundle ID: `hu.sikermaker.app`. Ha még nem jelenik meg a listában, előbb futtasd egyszer a felhőbuildet;
   - SKU: `sikermaker-ios`.
2. **Users and Access → Integrations → App Store Connect API → +** (szerepkör: **Admin**, mert ez kell az automatikus
   aláíráshoz). Töltsd le a `.p8` fájlt (csak egyszer lehet!), és jegyezd fel a **Key ID**-t és az **Issuer ID**-t.
3. **Business:** nézd át, hogy a Free Apps megállapodás aktív-e. Banki és adóadat csak a későbbi Apple-fizetéshez kell.
4. **EU-s kereskedői státusz (DSA):** App Store Connect → Business → a cég adataival „Trader”-ként. Az EU-s
   áruházban ez kötelező, és a cím, az e-mail és a telefonszám nyilvánosan megjelenik.

### 3. GitHub (a repó → Settings → Secrets and variables → Actions → New repository secret)
| Titok | Érték |
|---|---|
| `APPLE_TEAM_ID` | a Team ID |
| `ASC_KEY_ID` | az API-kulcs Key ID-ja |
| `ASC_ISSUER_ID` | az Issuer ID |
| `ASC_KEY_P8_BASE64` | a `.p8` fájl base64-ben: `base64 -i AuthKey_XXXX.p8` (macOS) vagy `base64 -w0 AuthKey_XXXX.p8` |

### 4. Vercel (Production környezeti változó)
- `APPLE_TEAM_ID` = a Team ID → újratelepítés. Ellenőrzés: a `https://sikermaker.hu/.well-known/apple-app-site-association`
  egy JSON-t ad, benne a `TEAMID.hu.sikermaker.app` szöveggel.

### 5. Supabase
- Auth → URL Configuration → **Redirect URLs**: legyen benne a `https://sikermaker.hu/app`, mert az app a leveleket ide
  irányítja vissza. Ha a Site URL már ez, nincs teendő.

## Build és feltöltés
GitHub → **Actions → „iOS → TestFlight” → Run workflow** (a verzió megadható, pl. `1.0.0`), vagy egy `ios-v1.0.0`
tag feltöltése. Kb. 15–25 perc. A build-szám automatikusan nő. Utána App Store Connect → TestFlight: a build
feldolgozása után belső tesztelőként azonnal telepíthető a TestFlight appal.

Helyben, Mac-en (opcionális):
```bash
cd mobile && npm ci && npm run sync && open ios/App/App.xcodeproj
```

## Áruházi adatok (App Store Connect → az app → App Store fül)

**Név:** Sikermaker  
**Alcím (max. 30):** Napi tervező vállalkozóknak  
**Kategória:** Productivity (másodlagos: Business)  
**Kulcsszavak (max. 100):** `tervező,napi terv,teendő,célok,szokás,vállalkozó,naptár,emlékeztető,ügyfél,kapcsolat,planner`  
**Support URL:** https://sikermaker.hu/ · **Marketing URL:** https://sikermaker.hu/  
**Adatvédelmi URL:** https://sikermaker.hu/adatkezeles  
**Copyright:** 2026 polymAInd Kft.

**Leírás (javaslat):**
> A Sikermaker a napi tervező vállalkozóknak: a napi lépéseid, teendőid, időpontjaid, céljaid és szokásaid egy helyen,
> minden eszközödön ugyanúgy.
>
> • Vezérlőpult: a mai lépések, teendők és időpontok egy pillantásra
> • Naptár napi, heti és havi nézettel
> • Szokás-kihívások és célok, pontrendszerrel
> • Gondolattérkép és olvasási lista
> • Esti kérdések a nap zárásához, heti és havi értékelés
> • Matricák és jutalmak a kitartásért
> • Emlékeztetők: reggeli összefoglaló és esti zárás értesítésként
>
> A terved a fiókodhoz van mentve, így a telefonodon és a számítógépeden (sikermaker.hu) ugyanazt látod.

Az „Előfizetés”, „Pro”, ár vagy weboldalon vásárlás **ne** szerepeljen a leírásban és a képeken (3.1.3).

**Képernyőképek:** 6,9"-os iPhone (1320 × 2868), legalább 3, legfeljebb 10. Javaslat: Vezérlőpult, Naptár,
Szokások, Gondolattérkép, Beállítások → Emlékeztetők. Bemutató módban, mintaadatokkal elkészíthetők.

**Korhatár:** minden kérdésre „No/None” → 4+.

**App Privacy (Adatvédelem) — válaszok:**
- Data used to track you: **No**.
- Data linked to you:
  - **Contact Info → Email Address, Name:** App Functionality.
  - **User Content → Other User Content:** App Functionality. Ez a terv tartalma; a kapcsolatok és ügyfelek
    neve is ide tartozik.
  - **Identifiers → User ID:** App Functionality.
- Hirdetés, analitika, helyadat, egészségügyi adat: nincs.

**Titkosítás:** az `Info.plist`-ben `ITSAppUsesNonExemptEncryption = NO` van, így feltöltéskor nem kérdezi.

## Megjegyzés a reviewernek (App Review Information)

**Bejelentkezés kell: igen.** Hozz létre egy **demófiókot Pro-val**. A regisztráció után az Admin → Regisztrálók
menüben állíts be neki „ajándék” Pro-t. Az e-mail-címet és a jelszót írd be a Sign-in information mezőbe.

**Notes (javaslat, angolul):**
> Sikermaker is a daily planner for small business owners (Hungarian UI). The same account works on the web
> (sikermaker.hu) and in this app. The app has no in-app purchases and does not offer or mention any paid plan; users
> who already have access to additional features through their existing account see them after signing in. The demo
> account above has all features enabled.
> Native features: local notifications (Settings → Emlékeztetők: morning summary and evening review), haptics,
> universal links for sign-in emails. Account deletion: Beállítások (Settings) → Fiók → “Fiókom törlése”.
> You can also try the app without an account: on the sign-in screen tap “Kipróbálom belépés nélkül” (demo mode with
> sample data).

## Kockázat, amiről tudni kell

A 3.1.3(b)-es szabály szerint a máshol vett előfizetés az appban elvileg akkor használható, ha ugyanaz Apple-fizetéssel
is megvehető. A gyakorlatban az olyan appokat, amelyek ingyenesen is teljes értékűek, és **semmilyen módon nem
utalnak** a fizetős csomagra, általában elfogadják. Ezért nem lát az ingyenes felhasználó egyetlen zárolt Pro
funkciót sem. Ha a review mégis 3.1.1-re hivatkozva elutasít, a következő lépés az Apple-fizetés (RevenueCat vagy
StoreKit), szerveroldali szinkronnal a `sikertervezo_subscriptions` táblába.

## Későbbi teendők
- Apple-fizetés (ha a review kéri, vagy ha az appban is akartok értékesíteni).
- White label márkák saját appja: az Apple a sablonból gyártott appokat csak a márka saját fejlesztői fiókjából fogadja
  el (4.2.6). Addig a márkák felhasználói a webes felületet használják.
- iPad-támogatás: most csak iPhone (`TARGETED_DEVICE_FAMILY = 1`); bekapcsoláshoz 13"-os képernyőképek is kellenek.
