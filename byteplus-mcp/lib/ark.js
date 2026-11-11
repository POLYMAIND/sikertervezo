// BytePlus ModelArk API-hívások (Seedream kép, Seedance videó).
// Az API-kulcs CSAK a szerveren él (ARK_API_KEY környezeti változó), a Claude sosem látja.
"use strict";

const env = (k, d = "") => (process.env[k] == null || process.env[k] === "" ? d : String(process.env[k]));

const BASE_URL = () => env("ARK_BASE_URL", "https://ark.ap-southeast.bytepluses.com/api/v3").replace(/\/$/, "");
const IMAGE_MODEL = () => env("ARK_IMAGE_MODEL", "seedream-4-0-250828");
const VIDEO_MODEL = () => env("ARK_VIDEO_MODEL", "seedance-1-0-pro-250528");

class ArkError extends Error {}

async function ark(path, { method = "GET", body, timeoutMs = 55000 } = {}) {
  const key = env("ARK_API_KEY");
  if (!key) throw new ArkError("Az ARK_API_KEY nincs beállítva a szerveren (Vercel → Settings → Environment Variables).");
  let r;
  try {
    r = await fetch(BASE_URL() + path, {
      method,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e && (e.name === "TimeoutError" || e.name === "AbortError")) throw new ArkError("A BytePlus API nem válaszolt időben. Próbáld újra, vagy kérj kevesebb / kisebb képet.");
    throw new ArkError("Nem sikerült elérni a BytePlus API-t: " + (e && e.message ? e.message : String(e)));
  }
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  if (!r.ok) {
    const err = data && data.error ? data.error : null;
    const msg = err ? [err.code, err.message].filter(Boolean).join(": ") : (text || r.statusText).slice(0, 500);
    throw new ArkError(`BytePlus API hiba (${r.status}): ${msg}`);
  }
  return data || {};
}

module.exports = { ark, ArkError, IMAGE_MODEL, VIDEO_MODEL, BASE_URL };
