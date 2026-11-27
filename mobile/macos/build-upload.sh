#!/usr/bin/env bash
# Sikermaker macOS-app: Xcode-projekt generálása, archív, aláírás és feltöltés az App Store Connectbe (Mac).
# Aláírás: Xcode automatikus aláírása az App Store Connect API-kulccsal (felhőben kezelt tanúsítványok),
# mint az iPhone-appnál. Környezeti változók: APPLE_TEAM_ID, ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8_BASE64
# (a .p8 base64-ben vagy nyersen), APP_VERSION (pl. 1.0.0). Előtte: cd mobile && npm ci && node scripts/build-www.mjs
set -euo pipefail
cd "$(dirname "$0")"
: "${APPLE_TEAM_ID:?}" "${ASC_KEY_ID:?}" "${ASC_ISSUER_ID:?}" "${ASC_KEY_P8_BASE64:?}"
VERSION="${APP_VERSION:-1.0.0}"
BUILD="$(date -u +%Y%m%d%H%M)"   # mindig nagyobb, mint az előző feltöltésé
test -f ../www/index.html || { echo "Hiányzik a mobile/www (node scripts/build-www.mjs)"; exit 1; }

mkdir -p build
KEY="$PWD/build/asc_key.p8"
trap 'rm -f "$KEY"' EXIT
if grep -q "BEGIN PRIVATE KEY" <<<"$ASC_KEY_P8_BASE64"; then printf '%s\n' "$ASC_KEY_P8_BASE64" > "$KEY"
else printf '%s' "$ASC_KEY_P8_BASE64" | tr -d ' \r\n' | base64 --decode > "$KEY"; fi
grep -q "BEGIN PRIVATE KEY" "$KEY" || { echo "Az ASC_KEY_P8_BASE64 nem érvényes .p8 kulcs"; exit 1; }
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

xcodegen generate
echo "== Archív: $VERSION ($BUILD)"
xcodebuild -project Sikermaker.xcodeproj -scheme Sikermaker -configuration Release \
  -destination 'generic/platform=macOS' -archivePath build/Sikermaker.xcarchive archive \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic \
  MARKETING_VERSION="$VERSION" CURRENT_PROJECT_VERSION="$BUILD" "${AUTH[@]}"

cat > build/export.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>${APPLE_TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
echo "== Aláírás és feltöltés az App Store Connectbe"
xcodebuild -exportArchive -archivePath build/Sikermaker.xcarchive -exportOptionsPlist build/export.plist \
  -exportPath build/export "${AUTH[@]}"
echo "== Kész: Sikermaker $VERSION ($BUILD) feltöltve (App Store Connect → az app → macOS → TestFlight)"
