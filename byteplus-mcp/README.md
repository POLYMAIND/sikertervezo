# BytePlus MCP — kép és videó a Claude-ban

Saját MCP-szerver (csatoló), amellyel a Claude a **BytePlus ModelArk** modelljeivel generál:

| Eszköz | Mit csinál |
|---|---|
| `generate_image` | Képgenerálás vagy képszerkesztés (Seedream). Szövegből, vagy 1–10 referenciakép-URL alapján. Egyszerre akár 6 összetartozó kép. |
| `create_video` | Videógenerálás indítása (Seedance): szövegből, első (és utolsó) képkockából vagy referenciaképekből. |
| `get_video` | A videó állapota, és ha elkészült, a linkje (legfeljebb 50 mp-et vár). |

A BytePlus API-kulcs csak a Vercelen van, a Claude-ba sosem kerül. A szerver állapotmentes, külső függősége nincs.
A BytePlus által visszaadott **linkek 24 óráig élnek**, ezért mentsd le, amit meg akarsz tartani.

---

## Telepítés (egyszer, kb. 10 perc)

### 1. BytePlus: kulcs és modellek
1. A [ModelArk konzolban](https://console.byteplus.com/ark) kapcsold be (Activate) a használni kívánt modelleket, pl. a Seedream 4.x-et és a Seedance-et.
2. Az **API Key Management** menüben hozz létre egy API-kulcsot.
3. Jegyezd fel a modellek pontos azonosítóját (Model ID, pl. `seedream-4-0-250828`), vagy ha végpontot (endpoint) hoztál létre, annak `ep-...` azonosítóját.

### 2. Vercel: új projekt ebből a mappából
1. A Vercelben válaszd az **Add New → Project** menüpontot, és importáld ezt a repót.
2. A **Root Directory** legyen `byteplus-mcp` (ez a lényeg, így a Sikermaker apptól teljesen külön települ).
3. Az **Environment Variables** résznél add meg ezeket:

| Változó | Érték |
|---|---|
| `ARK_API_KEY` | a BytePlus API-kulcs (**titkos**) |
| `MCP_TOKEN` | egy hosszú véletlen jelszó (**titkos**). Előállítása: `openssl rand -hex 24` |
| `ARK_IMAGE_MODEL` | opcionális, alapból `seedream-4-0-250828` |
| `ARK_VIDEO_MODEL` | opcionális, alapból `seedance-1-0-pro-250528` |
| `ARK_BASE_URL` | opcionális, alapból `https://ark.ap-southeast.bytepluses.com/api/v3` |

4. **Deploy.** A projekt beállításaiban (Settings → Git) érdemes bekapcsolni, hogy csak akkor épüljön újra, ha a `byteplus-mcp` mappa változik.

A csatoló címe:

```
https://<projekt-neve>.vercel.app/mcp/<MCP_TOKEN>
```

Ez a cím jelszóként működik: aki ismeri, a te keretedből generálhat. Ne oszd meg. Ha kiszivárog, írd át az `MCP_TOKEN`-t a Vercelen, telepítsd újra, és cseréld le a címet a Claude-ban is.

### 3. Claude: csatoló hozzáadása
**claude.ai (web, asztali app, telefon):** Beállítások → **Csatolók (Connectors)** → **Egyéni csatoló hozzáadása (Add custom connector)**. Név: `BytePlus`, URL: a fenti cím. Ezután bármelyik beszélgetésben vagy projektben bekapcsolhatod a beszélgetés eszközmenüjéből.

**Claude Code (terminál):**

```bash
claude mcp add --transport http --scope user byteplus https://<projekt-neve>.vercel.app/mcp/<MCP_TOKEN>
```

---

## Használat — példák a chatben
- „Generálj egy 9:16-os, 2K-s képet egy minimalista kávézóról reggeli fényben.”
- „Ebből a képből (URL) csinálj 4 változatot más-más háttérrel.”
- „Készíts 5 mp-es, 1080p, 9:16-os videót: lassú ráközelítés egy gőzölgő kávéscsészére.”
- „Ezt a képet (URL) keltsd életre: a haj lebegjen a szélben, a kamera álljon.”

Videónál a Claude elindítja a feladatot, majd magától lekérdezi, amíg el nem készül (általában 1–5 perc).

**Korlát:** a chatbe feltöltött képet a Claude nem tudja közvetlenül átadni. Referenciaképnek **nyilvános URL** kell (pl. egy korábban generált kép linkje vagy egy megosztott kép).

---

## Hibaelhárítás
| Üzenet | Teendő |
|---|---|
| `ARK_API_KEY nincs beállítva` | Add meg a Vercelen, majd telepítsd újra (Redeploy). |
| `401 unauthorized` (a csatoló nem kapcsolódik) | Rossz a token a címben, vagy nincs újratelepítve az `MCP_TOKEN` változása után. |
| `ModelNotOpen` / `model ... not found` | A modell nincs aktiválva a ModelArkban, vagy más az azonosítója. Állítsd be az `ARK_IMAGE_MODEL` / `ARK_VIDEO_MODEL` változót. |
| `... SensitiveContent ...` | A BytePlus tartalomszűrője blokkolta. Fogalmazd át a promptot. |
| időtúllépés képnél | Kérj kevesebb képet egyszerre (`count`) vagy kisebb méretet. |

## Fejlesztés
```bash
cd byteplus-mcp && npm test
```

A modelleket a `lib/ark.js`, az eszközöket a `lib/tools.js`, a protokollt a `lib/mcp.js` írja le.
A mappa önálló, saját repóba is áthelyezhető.
