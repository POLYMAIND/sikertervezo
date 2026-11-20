# Sikermaker natív app

iOS- és Android-app (Capacitor 8). Az élő `https://sikermaker.hu/app` webappot tölti be, így minden webes változás azonnal az appban is megjelenik; új áruházi verzió csak a natív részekhez kell (ikon, név, natív funkció).

- `capacitor.config.json`: app-azonosító (`hu.sikermaker.app`), betöltött oldal, engedélyezett domainek
- `www/offline.html`: ha nincs net
- `assets/`: ikon és nyitókép forrása (`npx @capacitor/assets generate --android --ios`)
- CI: `.github/workflows/app-build.yml` (Android teszt-APK az Actions alól letölthető)

Az appban (`window.Capacitor.isNativePlatform()`) nincs Pro-vásárlás, ár és előfizetés-kezelés gomb: digitális előfizetést az áruházak csak a saját fizetésükkel engednek eladni. A Pro-t a weben veszik meg, belépés után az appban is él. Fiók törlése: Beállítások → Fiók → Fiók törlése (App Store 5.1.1(v)).

Ismert korlát: a Google-naptár bekötése (Google OAuth) WebView-ban nem engedélyezett, ezt a felhasználó a weben tudja megcsinálni.
