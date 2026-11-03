# A Sikermaker jogi oldalainak előállítója (Impresszum, Adatkezelési tájékoztató, ÁSZF).
# Forrás: a PolyOS jogi oldalai (polyos.hu), a Sikermaker tényleges adatkezelésére szabva.
# Futtatás:  python3 scripts/build-legal.py   -> public/impresszum.html, public/adatkezeles.html, public/aszf.html
import os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HATALYOS = "2026. november 7."
HATALYOS_TOL = "2026. november 7-étől"
CEG = "polymAInd Kft. (székhely: 2013 Pomáz, Nyár utca 46/A 1. ajtó; cégjegyzékszám: 13 09 239925; adószám: 32793363-2-13)"
EMAIL = '<a href="mailto:hello@polymaind.hu">hello@polymaind.hu</a>'

def page(slug, title, lead, body):
    return f"""<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1F2024">
<title>{html.escape(title)} – Sikermaker</title>
<meta name="description" content="{html.escape(lead)}">
<link rel="canonical" href="https://sikermaker.hu/{slug}">
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/css/start.css">
</head>
<body class="legalpage">
<header class="top scrolled"><div class="in">
  <a class="logo" href="/"><img src="/logo.svg" width="32" height="32" alt=""><span>Sikermaker</span></a>
  <nav class="links legal-links" aria-label="Jogi oldalak"><a href="/impresszum">Impresszum</a><a href="/adatkezeles">Adatkezelés</a><a href="/aszf">ÁSZF</a></nav>
</div></header>
<main class="legal in narrow">
  <p class="kicker">Jogi</p>
  <h1>{html.escape(title)}</h1>
  <p class="lead sm">{lead}</p>
{body}
</main>
<footer class="foot"><div class="in copy-r" style="margin-top:0;border-top:0">© Polymaind · Sikermaker · <a href="/impresszum">Impresszum</a> · <a href="/adatkezeles">Adatkezelési tájékoztató</a> · <a href="/aszf">ÁSZF</a></div></footer>
</body>
</html>
"""

impresszum = f"""
  <dl class="kv">
    <dt>Szolgáltatás neve</dt><dd>Sikermaker (napi tervező vállalkozóknak, a PolyOS alapmodulja)</dd>
    <dt>Üzemeltető</dt><dd>polymAInd Kft.</dd>
    <dt>Székhely</dt><dd>2013 Pomáz, Nyár utca 46/A 1. ajtó</dd>
    <dt>Cégjegyzékszám</dt><dd>13 09 239925</dd>
    <dt>Adószám</dt><dd>32793363-2-13</dd>
    <dt>E-mail</dt><dd>{EMAIL}</dd>
    <dt>Telefon</dt><dd><a href="tel:+36706005655">+36 70 600 5655</a></dd>
    <dt>Weboldal</dt><dd><a href="https://sikermaker.hu">sikermaker.hu</a></dd>
    <dt>Tárhelyszolgáltató</dt><dd>Vercel Inc. (San Francisco, CA, USA; a kiszolgálás az EU-ban, Frankfurtban történik) · adatbázis: Supabase (EU, Frankfurt)</dd>
  </dl>
  <h2>Kapcsolat</h2>
  <p>Bármilyen kérdéssel, panasszal vagy adatkezeléssel kapcsolatos megkereséssel fordulj hozzánk a {EMAIL} címen. Igyekszünk 5 munkanapon belül válaszolni.</p>
  <h2>Fogyasztóvédelem, jogorvoslat</h2>
  <p>Panasz esetén a lakóhelyed szerint illetékes békéltető testülethez, illetve a fogyasztóvédelmi hatósághoz fordulhatsz. Adatvédelmi kérdésben a Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH, 1055 Budapest, Falk Miksa utca 9-11.) eljárása kezdeményezhető.</p>
"""

def rows(items):
    return "\n".join(f"      <tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in items)

adat = [
    ("Várólista: e-mail-cím, a feliratkozás ideje és helye (pl. főoldal), letöltések száma", "Értesítés a nyitásról, az ajándék (Káoszmanager) letöltő linkjének elküldése", "Hozzájárulás (GDPR 6. cikk (1) a)", "A hozzájárulás visszavonásáig, legfeljebb a nyitást követő 12 hónapig"),
    ("Várólista: az IP-cím kulcsolt, visszafejthetetlen lenyomata", "Visszaélés (tömeges, automatizált feliratkozás) kiszűrése", "Jogos érdek (6. cikk (1) f)", "A feliratkozási adatokkal együtt"),
    ("Fiók: név, e-mail-cím, jelszó (csak titkosított lenyomatként), regisztráció és utolsó belépés ideje", "Regisztráció, belépés, a szolgáltatás nyújtása", "Szerződés teljesítése (6. cikk (1) b)", "A fiók törléséig"),
    ("A terv tartalma: napi lépések, teendők, naptár, célok, szokások, jegyzetek, gondolattérkép, matricák", "A szolgáltatás nyújtása, felhőmentés, szinkron az eszközeid között", "Szerződés teljesítése (6. cikk (1) b)", "A fiók törléséig, illetve amíg te nem törlöd"),
    ("Előfizetés: csomag, állapot, érvényesség", "A Pro funkciók elérhetősége, előfizetés kezelése", "Szerződés teljesítése (6. cikk (1) b)", "A fiók törléséig; a számlázási adatok a számviteli törvény szerint 8 évig"),
    ("White label márka: név, e-mail-cím, regisztráció és utolsó aktivitás dátuma — a márka gazdája felé", "Hogy a márka gazdája (pl. coach, oktató) lássa, kik használják az ő arculatával a tervezőt", "Hozzájárulás (6. cikk (1) a), bármikor visszavonható a Beállításokban", "A hozzájárulás visszavonásáig"),
    ("Az appból küldött e-mailek naplója: időpont, a címzett domainje (nem a teljes cím), siker", "Napi küldési korlát, visszaélés-megelőzés", "Jogos érdek (6. cikk (1) f)", "Legfeljebb 12 hónap"),
    ("Naptár-kapcsolatok: a feliratkozó link azonosítójának lenyomata, a behúzott naptárak linkje titkosítva", "Naptár-szinkron (feliratkozás Google / iPhone naptárból, más naptárak behúzása)", "Szerződés teljesítése (6. cikk (1) b)", "Amíg a kapcsolatot meg nem szünteted"),
    ("Biztonsági napló: adminisztrátori és jogosultsági műveletek (ki, mikor, mit)", "A rendszer biztonsága, visszaélések felderítése", "Jogos érdek (6. cikk (1) f)", "Legfeljebb 2 év"),
]

feldolgozok = [
    ("Supabase", "Adatbázis, belépés és fájltárolás (a letölthető anyagok)", "EU (Frankfurt)"),
    ("Vercel", "Az alkalmazás kiszolgálása", "EU (Frankfurt) / USA"),
    ("Brevo (Sendinblue SAS)", "E-mailek kézbesítése (regisztráció, belépő link, jelszó, várólista, az appból küldött levelek); a kézbesítés technikai adatai (kézbesítve, megnyitva)", "EU (Franciaország)"),
    ("Google", "Betűtípusok kiszolgálása (Google Fonts): a betöltéskor az IP-címed a Google-hoz kerül", "USA"),
    ("PolyOS (polymAInd Kft.)", "Csak ha összekapcsolod: az általad egyenként átküldött tételek (pl. egy kapcsolat vagy egy teendő) a PolyOS-fiókodba", "EU"),
]

adatkezeles = f"""
  <p>Ez a tájékoztató bemutatja, hogyan kezeli a Sikermaker (üzemeltető: polymAInd Kft., a továbbiakban „mi”) a látogatók, a várólistára feliratkozók és a felhasználók személyes adatait. Hatályos: {HATALYOS_TOL}, a GDPR (EU 2016/679) és az Infotv. szerint.</p>

  <h2>1. Az adatkezelő</h2>
  <p>{CEG} · e-mail: {EMAIL} · telefon: <a href="tel:+36706005655">+36 70 600 5655</a>. A cég adatai az <a href="/impresszum">Impresszumban</a> is megtalálhatók.</p>

  <h2>2. Milyen adatokat kezelünk és miért</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>Adatkör</th><th>Cél</th><th>Jogalap</th><th>Megőrzés</th></tr></thead>
    <tbody>
{rows(adat)}
    </tbody>
  </table></div>

  <h2>3. A bemutató mód</h2>
  <p>A bemutató (belépés nélküli kipróbálás) mintaadatokkal működik. Amit ott beírsz, kizárólag a saját böngésződben marad, nem küldjük el nekünk, és nem tároljuk.</p>

  <h2>4. A tervedben szereplő más személyek adatai</h2>
  <p>A tervezőben kapcsolataid és ügyfeleid adatait (pl. név, telefonszám, születésnap, kedvenc termék) is rögzítheted. Ezekért az adatokért te felelsz adatkezelőként; mi kizárólag a te utasításod szerint, a szolgáltatás nyújtásához tároljuk őket (adatfeldolgozóként), más célra nem használjuk, és harmadik félnek nem adjuk át. Kérjük, csak olyan adatot rögzíts, amelynek kezelésére jogosult vagy.</p>

  <h2>5. Az adatok tárolása és az adatfeldolgozók</h2>
  <p>Az adatokat elsősorban az Európai Unióban tároljuk. A tervek, a márkák és a várólista adatai a böngészőből közvetlenül nem érhetők el; minden hozzáférés a szervereinken át, ellenőrzött jogosultsággal történik. A titkos kulcsok soha nem kerülnek a böngészőbe. Igénybe vett adatfeldolgozók:</p>
  <div class="tablewrap"><table>
    <thead><tr><th>Adatfeldolgozó</th><th>Feladat</th><th>Hely</th></tr></thead>
    <tbody>
{chr(10).join(f"      <tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in feldolgozok)}
    </tbody>
  </table></div>
  <p>Az USA-ba irányuló adattovábbítás megfelelő garanciák (az EU általános szerződési feltételei, illetve az EU–USA adatvédelmi keretrendszer) mellett történik. Ha a jövőben online fizetést vezetünk be a Pro csomaghoz, a fizetési és számlázási szolgáltatót itt, előre feltüntetjük.</p>

  <h2>6. A várólista és az ajándék</h2>
  <p>A várólistára az e-mail-címed megadásával és a hozzájárulásod bejelölésével iratkozol fel. Ekkor egy levelet küldünk a Káoszmanager letöltő linkjével (7 napig érvényes), és a Sikermaker nyitásakor egy értesítést. Más levelet a hozzájárulásod alapján nem küldünk. A hozzájárulást bármikor visszavonhatod egy, a {EMAIL} címre küldött levéllel; ekkor a címedet töröljük.</p>

  <h2>7. Sütik és helyi tárolás</h2>
  <p>Nem használunk marketing- vagy nyomkövető sütiket, és nem mérjük a látogatásaidat. A böngésződ helyi tárolójában kizárólag a működéshez szükséges adatok vannak: a belépési munkamenet, a beállításaid (pl. a választott háttér), és bemutató módban a mintaadatok.</p>

  <h2>8. Jogaid</h2>
  <ul>
    <li>Hozzáférés a rólad kezelt adatokhoz, helyesbítés, törlés („elfeledtetés”)</li>
    <li>Az adatkezelés korlátozása és az ellene való tiltakozás</li>
    <li>Adathordozhatóság: a tervedet a Beállításokban bármikor letöltheted géppel olvasható (JSON) formában</li>
    <li>A hozzájárulás bármikori visszavonása (várólista, white label márka gazdája felé)</li>
    <li>Panasz a NAIH-nál (1055 Budapest, Falk Miksa u. 9-11.), illetve bírósághoz fordulás</li>
  </ul>
  <p>Jogaid gyakorlásához írj a {EMAIL} címre; legkésőbb 30 napon belül válaszolunk.</p>

  <h2>9. Változtatás</h2>
  <p>A tájékoztatót időről időre frissíthetjük; a lényeges változásokról a szolgáltatáson belül vagy e-mailben értesítünk.</p>
"""

aszf = f"""
  <p>Hatályos: {HATALYOS_TOL}.</p>

  <h2>1. A szolgáltatás</h2>
  <p>A Sikermaker (üzemeltető: {CEG}) felhőalapú napi tervező vállalkozóknak: napi lépések, teendők, naptár, kapcsolatok és ügyfelek, tartalomtervező, célok, szokások, gondolattérkép, heti és havi értékelő, matricák. A Sikermaker a PolyOS üzleti rendszer alapmodulja. A szolgáltatás igénybevételével elfogadod a jelen feltételeket és az <a href="/adatkezeles">Adatkezelési tájékoztatót</a>.</p>

  <h2>2. Bemutató és várólista</h2>
  <p>A bemutató mód regisztráció nélkül, mintaadatokkal kipróbálható; az ott beírt adatok csak a böngésződben maradnak. A nyitás előtt a várólistára iratkozhatsz fel; ajándékként ilyenkor letöltheted a Káoszmanager nyomtatható csomagot. A Káoszmanager személyes használatra szól; kinyomtathatod és sokszorosíthatod a saját használatodra, de értékesíteni vagy saját termékként terjeszteni nem szabad.</p>

  <h2>3. Regisztráció és fiók</h2>
  <p>A regisztrációhoz valós adatok szükségesek. Te felelsz a belépési adataid biztonságáért és a fiókodban végzett tevékenységért. A fiókodat és a tervedet bármikor törölheted, illetve kérheted a törlését a {EMAIL} címen.</p>

  <h2>4. Csomagok és díjak</h2>
  <ul>
    <li><b>Ingyenes:</b> időkorlát nélkül használható alapcsomag (Vezérlőpult, napi lépések, naptár az appon belül, gondolattérkép, célok, szokások, olvasólista, értékelők, matricák).</li>
    <li><b>Pro:</b> 1 990 Ft / hó. Az Ingyenes csomagon felül: Kapcsolatok, Ügyfelek, Tartalomtervező, naptár-szinkron más naptárakkal, e-mail-küldés az appból.</li>
    <li><b>White label:</b> egyedi ajánlat alapján, külön megállapodással (saját név, logó, színek a partner felhasználóinak).</li>
  </ul>
  <p>A Pro csomag online megvásárlásának módjáról (fizetési szolgáltató, számlázás) a vásárlás előtt tájékoztatunk. A Pro előfizetés havonta előre esedékes, és bármikor lemondható a folyó időszak végére. Az árak változtatásának jogát fenntartjuk; a változásról előzetesen értesítünk, és a már kifizetett időszakra nem vonatkozik.</p>

  <h2>5. Lemondás és elállás</h2>
  <p>Az előfizetés bármikor lemondható; a lemondás a folyó számlázási időszak végén lép hatályba, a már kifizetett díjat időarányosan nem térítjük vissza, kivéve a jogszabály által kötelező eseteket. Fogyasztónak minősülő felhasználóként a szolgáltatás azonnali megkezdésébe való kifejezett beleegyezéseddel tudomásul veszed, hogy az azonnal hozzáférhető digitális szolgáltatás megkezdése után az elállási jog a jogszabályi keretek szerint korlátozott lehet.</p>

  <h2>6. A felhasználó felelőssége</h2>
  <ul>
    <li>Tilos jogellenes, jogsértő vagy harmadik fél jogát sértő tartalom feltöltése.</li>
    <li>Tilos a rendszer biztonságának megkerülése, terhelése vagy visszaélésszerű használata (pl. tömeges levélküldés az appból).</li>
    <li>A tervedben rögzített más személyek (kapcsolatok, ügyfelek) adataiért te felelsz; csak olyan adatot rögzíts, amelynek kezelésére jogosult vagy.</li>
  </ul>

  <h2>7. White label partnerek</h2>
  <p>White label márka esetén a tervező a partner nevével és arculatával jelenik meg. A partner a felhasználói közül csak azok nevét, e-mail-címét, regisztrációs és utolsó aktivitási dátumát látja, akik ehhez kifejezetten hozzájárultak; a tervek tartalmát soha nem látja. A szolgáltatást ilyenkor is a polymAInd Kft. nyújtja, a jelen feltételek szerint.</p>

  <h2>8. Rendelkezésre állás és felelősség</h2>
  <p>Törekszünk a magas rendelkezésre állásra, de a szolgáltatást „adott állapotban” nyújtjuk; tervezett karbantartás vagy külső szolgáltató kiesése átmeneti fennakadást okozhat. Javasoljuk, hogy a fontos adataidról időnként készíts mentést (Beállítások → az adataid letöltése). Felelősségünk a jogszabály által megengedett mértékig korlátozott; nem felelünk közvetett károkért vagy elmaradt haszonért.</p>

  <h2>9. Szellemi tulajdon</h2>
  <p>A Sikermaker felülete, szövegei, matricái és letölthető anyagai a polymAInd Kft. szellemi tulajdonát képezik. A saját tervedbe beírt tartalom a tiéd.</p>

  <h2>10. Adatkezelés</h2>
  <p>A személyes adatok kezeléséről az <a href="/adatkezeles">Adatkezelési tájékoztató</a> rendelkezik, amely a jelen ÁSZF elválaszthatatlan része.</p>

  <h2>11. Irányadó jog</h2>
  <p>A jelen feltételekre a magyar jog az irányadó. Jogvita esetén a felek békés rendezésre törekednek; ennek eredménytelensége esetén a hatáskörrel és illetékességgel rendelkező magyar bíróság jár el. Fogyasztói panasz esetén a lakóhelyed szerinti békéltető testülethez is fordulhatsz.</p>
"""

for slug, title, lead, body in [
    ("impresszum", "Impresszum", "A Sikermaker üzemeltetőjének adatai (Ekertv. 4. §).", impresszum),
    ("adatkezeles", "Adatkezelési tájékoztató", "Hogyan kezeljük a várólistára feliratkozók és a felhasználók személyes adatait.", adatkezeles),
    ("aszf", "Általános Szerződési Feltételek", "A Sikermaker használatának feltételei.", aszf),
]:
    with open(os.path.join(ROOT, "public", slug + ".html"), "w", encoding="utf-8") as f:
        f.write(page(slug, title, lead, body))
print("ok")
