# Auth-levelek a Brevón át (Supabase Send Email Hook)

A Supabase beépített levelezője csak a projekt csapattagjainak küld, és óránként ~2 levelet enged. Ezért a
Supabase minden auth-levelet (regisztráció megerősítése, belépő link, új jelszó, e-mail-csere, meghívó,
megerősítő kód) a `/api/auth-email` végpontnak ad át, az pedig a **Brevo API-n** küldi ki (`BREVO_API_KEY`,
`EMAIL_FROM` — ugyanaz, mint a várólista-leveleknél), a `docs/email-sablonok` sablonjaival.

## Beállítás

1. **Supabase** → Authentication → **Hooks** → **Send Email hook** → Add.
   - Hook type: **HTTPS**
   - URL: `https://sikermaker.hu/api/auth-email`
   - Secret: **Generate secret** → másold ki (`v1,whsec_…`).
   - Enable → Create.
2. **Vercel** → sikertervezo → Environment Variables (Production): `SEND_EMAIL_HOOK_SECRET` = a kimásolt titok
   (az egész, `v1,whsec_…`). Utána Redeploy.
3. **Próba:** a belépőoldalon „Belépő link e-mailben” egy NEM csapattag címre → a levél a Sikermaker feladóval jön.

Az 1. és 2. lépés között az auth-levelek hibát adnak (a végpont titok nélkül 503), ezért a kettőt egymás után csináld.

## Hibák
- Rossz aláírás → 401, Brevo-hiba → 502: a Supabase ilyenkor hibát mutat a felhasználónak (nem „elküldtük”).
- Vercel → Logs: `[auth-email] brevo failed` sor jelzi a Brevo-elutasítást.
- Visszaállás: a Supabase-ben a hook kikapcsolása → újra a beépített levelező küld.
