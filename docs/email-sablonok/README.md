# Supabase e-mail-sablonok (magyar)

Supabase → Authentication → Emails → Templates. Mindegyiknél a **Subject** mezőbe a lenti tárgy, a **Body** (Source) mezőbe a megfelelő `.html` fájl teljes tartalma.

| Supabase-sablon | Fájl | Tárgy |
|---|---|---|
| Confirm signup | `1-regisztracio-megerositese.html` | Még egy kattintás, és indulhatsz – Sikertervező |
| Magic link | `2-belepo-link.html` | A belépő linked – Sikertervező |
| Reset password | `3-uj-jelszo.html` | Új jelszó beállítása – Sikertervező |
| Change email address | `4-email-cim-modositas.html` | Erősítsd meg az új e-mail-címed – Sikertervező |
| Invite user | `5-meghivo.html` | Meghívót kaptál a Sikertervezőbe |
| Reauthentication | `6-megerosito-kod.html` | A megerősítő kódod – Sikertervező |

A feladó neve és címe (most: „Supabase Auth <noreply@mail.app.supabase.io>”) csak saját SMTP-vel cserélhető: Authentication → Emails → SMTP Settings.
