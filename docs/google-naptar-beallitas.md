# Kétirányú Google Naptár-szinkron – mit kell beállítani

Ehhez egy saját **Google Cloud alkalmazás** kell. Ezzel kér engedélyt a Sikertervező a felhasználótól, hogy olvashassa
és írhassa a Google Naptárát. Ezt a Polymaind nevében egyszer kell létrehozni. Utána én bekötöm a kódba.

Idő: a beállítás kb. 30–45 perc. A Google **ellenőrzése** (verification) a naptár-hozzáféréshez **1–6 hét**.
Amíg ez fut, legfeljebb 100 tesztfelhasználóval (akiket név szerint felveszel) már működik.

## Amire szükség lesz előtte
- Egy Google-fiók, ami a Polymaindhoz tartozik (pl. web@polymaind.hu).
- Végleges domain a tervezőnek (pl. sikertervezo.hu, vagy egy aldomain). A Google a `vercel.app` címet nem fogadja el
  ellenőrzött alkalmazáshoz, ezért ezt a domain-ügy rendezése után érdemes véglegesíteni.
- Nyilvános **Adatkezelési tájékoztató** és **ÁSZF** oldal az app domainjén (ezek a regisztrációhoz is kellenek).

## 1. Projekt létrehozása
1. Nyisd meg: https://console.cloud.google.com/ és lépj be a Polymaind-fiókkal.
2. Fent a projektválasztóban: **New Project** → név: `Sikertervezo` → **Create**.

## 2. A Google Calendar API bekapcsolása
1. Bal menü: **APIs & Services → Library**.
2. Keresd meg: **Google Calendar API** → **Enable**.

## 3. Hozzájárulási képernyő (OAuth consent screen)
1. **APIs & Services → OAuth consent screen** (újabb felületen: **Google Auth Platform → Branding**).
2. User type: **External** → Create.
3. Kitöltendő:
   - App name: `Sikertervező`
   - User support email: `hello@polymaind.hu`
   - App logo: a Sikertervező ikonja (120×120 px PNG)
   - App home page: `https://<a-végleges-domain>/`
   - Privacy policy: `https://<a-végleges-domain>/adatkezeles`
   - Terms of service: `https://<a-végleges-domain>/aszf`
   - Authorized domains: `<a-végleges-domain>`
   - Developer contact: `web@polymaind.hu`
4. **Scopes (Data access)** → Add or remove scopes → add hozzá:
   - `https://www.googleapis.com/auth/calendar.events` (események olvasása és írása)
   - `https://www.googleapis.com/auth/calendar.readonly` (a naptárlista olvasása)
   - `openid`, `email`
5. **Test users (Audience)**: vedd fel magad és pár tesztelőt (legfeljebb 100 fő), amíg az ellenőrzés nem kész.

## 4. Az OAuth kliens létrehozása
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**, név: `Sikertervező web`.
3. **Authorized JavaScript origins**: `https://<a-végleges-domain>` (és átmenetileg `https://sikertervezo.vercel.app`)
4. **Authorized redirect URIs**: `https://<a-végleges-domain>/api/google-callback`
   (és átmenetileg `https://sikertervezo.vercel.app/api/google-callback`)
5. **Create**. Megkapod a **Client ID**-t és a **Client secret**-et.

## 5. Az adatok átadása
A Vercelen, a `sikertervezo` projekt **Settings → Environment Variables** menüjében vedd fel:

| Név | Érték | Típus |
|---|---|---|
| `GOOGLE_CLIENT_ID` | a Client ID | Plain |
| `GOOGLE_CLIENT_SECRET` | a Client secret | **Sensitive** |

A Client secretet **ne küldd el chatben vagy e-mailben**: közvetlenül a Vercelbe írd be. Ha kész, szólj, és bekötöm a
kétirányú szinkront (Google-fiók összekapcsolása, naptárválasztás, oda-vissza írás, ütközéskezelés).

## 6. Google-ellenőrzés (verification)
A naptár-hozzáférés „érzékeny” jogosultság, ezért élesítés előtt a Google ellenőrzi az alkalmazást:
1. **OAuth consent screen → Publish app** (Testingből Productionbe).
2. A Google ezt kéri:
   - a domain tulajdonjogának igazolása a Google Search Console-ban,
   - egy rövid (1–3 perces) **videó** arról, hogyan kéri és használja az app a naptár-hozzáférést (ezt elkészítem
     a forgatókönyvvel együtt, ha odáig értünk),
   - indoklás, miért kell a `calendar.events` jogosultság (megírom),
   - a tájékoztatóban le kell írni, mit csinál az app a Google-adatokkal (sablont adok hozzá).
3. Az ellenőrzésig a tesztfelhasználók már használhatják.

## iPhone (iCloud) kétirányú szinkron
Az Apple-nek nincs ilyen nyilvános naptár-API-ja. Két jó megoldás van:
- **Ajánlott:** ha valaki iPhone-on a Google-fiókját használja naptárnak (Beállítások → Naptár → Fiókok → Google),
  akkor a Google-szinkron az iPhone-on is kétirányúan működik.
- iCloud-naptárhoz a CalDAV protokoll kell egy „alkalmazásspecifikus jelszóval” (az Apple ID-nál generálható).
  Ez megoldható, de a felhasználónak több lépés. Ha kell, ez a következő kör.

Addig is már most működik:
- **a tervező → bármelyik naptár:** feliratkozó link (Beállítások → Naptár-szinkron),
- **bármelyik naptár → a tervező:** a „Más naptárak behúzása” részben az iCal-link beillesztésével (Pro).
