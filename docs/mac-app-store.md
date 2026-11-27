# Sikermaker Mac-app: Mac App Store

A Mac-app a `mobile/macos/` mappában van. Natív macOS-app (SwiftUI + WKWebView), amely ugyanazt az appba
csomagolt webes tervezőt futtatja, mint az iPhone-app (`mobile/www`), **asztali elrendezéssel** (bal oldali menü).
Az App Store-ban **ugyanaz az app** (bundle ID `hu.sikermaker.app`, Universal Purchase): az iPhone-app rekordjához
egy macOS platform kerül.

Miért nem Mac Catalyst? A Capacitor iOS-keretrendszere előre lefordítva érkezik, és nincs benne Mac-es rész, így
az iPhone-projekt Macre nem fordítható. A Mac-app a natív részeket maga adja: a `Bridge.swift` a Capacitor
hídprotokollját utánozza, ezért a webes kód (`vendor/capacitor.js` + `js/native.js`) változtatás nélkül fut.

| Mi | Hol |
|---|---|
| App, ablak, értesítések kezelése | `mobile/macos/Sikermaker/SikermakerApp.swift` |
| Webnézet, fájlkiszolgálás (`capacitor://localhost/`), linkek, fájlválasztó, letöltés | `mobile/macos/Sikermaker/WebContainer.swift` |
| Híd: `CapacitorHttp` (csak a `sikermaker.hu`), `LocalNotifications`, `App` (universal link), `Browser` | `mobile/macos/Sikermaker/Bridge.swift` |
| Xcode-projekt (XcodeGen), Info.plist, jogosultságok (sandbox, hálózat, fájlválasztó, associated domains) | `mobile/macos/project.yml` |
| Build + aláírás + feltöltés | `mobile/macos/build-upload.sh`, `.github/workflows/mac-appstore.yml` |
| Képernyőképek (2880 × 1800) | `mobile/scripts/screenshots-mac.mjs` → `mobile/fastlane/screenshots-mac/hu` |
| Reviewer-megjegyzés | `mobile/fastlane/notes-mac.txt` |
| A híd tesztje (valódi `capacitor.js` + `native.js`) | `mobile/tests/mac.test.mjs` |

Az appban ugyanaz az App Store-mód van, mint iPhone-on (nincs vásárlás és ár). Mac-en működik a fájlfeltöltés
(macOS fájlválasztó) és a letöltés (Adataim letöltése, oklevél: macOS mentés ablak).

## Beállítás (egyszer)

1. **App Store Connect → Apps → Sikermaker → bal oldalt „+” (Add Platform) → macOS.** A verzió legyen **1.0.0**.
2. **Pricing and Availability:** az „iPhone and iPad Apps on Apple Silicon Macs” lehetőséget kapcsold ki, mert
   ehelyett a saját Mac-app lesz elérhető.
3. A GitHub-titkok ugyanazok, mint az iPhone-buildnél, új titok nem kell.

## Build és feltöltés
GitHub → Actions → **„Mac → App Store” → Run workflow** (verzió: `1.0.0`). Kb. 15–20 perc. Utána App Store Connect
→ TestFlight → **macOS**: a build feldolgozása után a Mac-en a **TestFlight** appból telepíthető.

## Adatlap
Actions → **„App Store-adatlap (iPhone / Mac)” → Run workflow** → platform: **osx**, verzió: **1.0.0**. Feltölti a
leírást, a kulcsszavakat, a Mac-képernyőképeket és a Mac-re szabott reviewer-megjegyzést. Az App Privacy és a
korhatár közös az iPhone-appal, azokat nem kell újra kitölteni.

## Beküldés
Az iPhone-app jóváhagyása után: App Store Connect → macOS 1.0.0 → **Build +** → **Add for Review → Submit**.
A reviewer a Mac-es képernyőfelvételt is kérheti. Ezt Mac-en a **Shift–Cmd–5** billentyűparanccsal lehet felvenni,
ugyanabban a sorrendben, mint az iPhone-on.
