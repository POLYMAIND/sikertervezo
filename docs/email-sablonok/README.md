# Supabase e-mail-sablonok (magyar)

Supabase → Authentication → Emails → Templates. Mindegyiknél a **Subject** mezőbe a lenti tárgy, a **Body** (Source) mezőbe a megfelelő `.html` fájl teljes tartalma.

| Supabase-sablon | Fájl | Tárgy |
|---|---|---|
| Confirm signup | `1-regisztracio-megerositese.html` | Még egy kattintás, és indulhatsz – Sikermaker |
| Magic link | `2-belepo-link.html` | A belépő linked – Sikermaker |
| Reset password | `3-uj-jelszo.html` | Új jelszó beállítása – Sikermaker |
| Change email address | `4-email-cim-modositas.html` | Erősítsd meg az új e-mail-címed – Sikermaker |
| Invite user | `5-meghivo.html` | Meghívót kaptál a Sikermakerbe |
| Reauthentication | `6-megerosito-kod.html` | A megerősítő kódod – Sikermaker |

A feladó neve és címe (most: „Supabase Auth <noreply@mail.app.supabase.io>”) csak saját SMTP-vel cserélhető: Authentication → Emails → SMTP Settings. Brevóval: host `smtp-relay.brevo.com`, port `587`, felhasználó a Brevo SMTP-loginja, jelszó a Brevo **SMTP-kulcsa** (nem az API-kulcs), feladó a Brevóban hitelesített cím, név: Sikermaker.
