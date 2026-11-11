// MCP-végpont: POST /mcp/<MCP_TOKEN>  (a vercel.json ide irányítja: /api/mcp?token=...)
// A Claude Code fejlécben is küldheti: Authorization: Bearer <MCP_TOKEN>
"use strict";

const crypto = require("crypto");
const { handleMessage } = require("../lib/mcp");

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

function providedToken(req) {
  const url = new URL(req.url || "/", "http://localhost");
  const q = (req.query && req.query.token) || url.searchParams.get("token");
  if (q) return String(q);
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let raw;
  if (typeof req.body === "string") raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString("utf8");
  else {
    const chunks = []; let size = 0;
    for await (const c of req) { size += c.length; if (size > 1_000_000) throw Object.assign(new Error("too_large"), { status: 413 }); chunks.push(c); }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  return JSON.parse(raw); // a hibát a hívó kezeli
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }

  const expected = process.env.MCP_TOKEN || "";
  if (expected.length < 16) return json(res, 503, { error: "MCP_TOKEN nincs beállítva (legalább 16 karakter)." });
  if (!crypto.timingSafeEqual(digest(providedToken(req)), digest(expected))) return json(res, 401, { error: "unauthorized" });

  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "Use POST (stateless MCP server, no SSE stream)." }); }

  let payload;
  try { payload = await readBody(req); }
  catch (e) {
    if (e && e.status === 413) return json(res, 413, { error: "too_large" });
    return json(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }

  if (Array.isArray(payload)) {
    const out = (await Promise.all(payload.map(handleMessage))).filter(Boolean);
    if (!out.length) { res.statusCode = 202; return res.end(); }
    return json(res, 200, out);
  }
  const out = await handleMessage(payload);
  if (!out) { res.statusCode = 202; return res.end(); }
  return json(res, 200, out);
};
