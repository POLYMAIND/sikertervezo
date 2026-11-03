// Helyi fejlesztői szerver Vercel CLI nélkül: kiszolgálja a public/ mappát és az api/*.js függvényeket.
// Használat:  node tests/devserver.mjs [port]      (a .env.local-t nem olvassa — exportáld a változókat)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const port = +process.argv[2] || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/")) {
    const name = u.pathname.slice(5).replace(/[^a-z0-9-]/g, "");
    const file = path.join(root, "api", name + ".js");
    if (!name || name.startsWith("_") || !fs.existsSync(file)) { res.statusCode = 404; return res.end("{}"); }
    try { await require(file)(req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end("{}"); }
    return;
  }
  let f = path.join(root, "public", path.normalize(u.pathname).replace(/^(\.\.[/\\])+/, ""));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
  if (!fs.existsSync(f)) f = path.join(root, "public", "index.html");
  res.setHeader("Content-Type", TYPES[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`Sikermaker: http://localhost:${port}`));
