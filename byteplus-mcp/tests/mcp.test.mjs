// node --test tests/*.test.mjs — a BytePlus API-t egy kamu fetch helyettesíti.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Readable } from "node:stream";

const require = createRequire(import.meta.url);
const handler = require("../api/mcp.js");
const { handleMessage } = require("../lib/mcp.js");

const TOKEN = "teszt-token-0123456789abcdef";
let calls = [];
let replies = [];

beforeEach(() => {
  process.env.MCP_TOKEN = TOKEN;
  process.env.ARK_API_KEY = "ark-teszt";
  delete process.env.ARK_IMAGE_MODEL;
  delete process.env.ARK_VIDEO_MODEL;
  calls = [];
  replies = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, method: opts.method, headers: opts.headers, body: opts.body ? JSON.parse(opts.body) : undefined });
    const r = replies.shift() || { status: 200, body: {} };
    return new Response(JSON.stringify(r.body), { status: r.status });
  };
});

const call = (name, args) => handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });

function fakeReq({ method = "POST", url = "/api/mcp?token=" + TOKEN, headers = {}, body } = {}) {
  const raw = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  const req = Readable.from(raw ? [Buffer.from(raw)] : []);
  Object.assign(req, { method, url, headers });
  return req;
}
function fakeRes() {
  const res = { statusCode: 200, headers: {}, body: "" };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (b) => { res.body = b || ""; };
  return res;
}
async function run(opts) {
  const res = fakeRes();
  await handler(fakeReq(opts), res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null, headers: res.headers };
}

// ---------- protokoll ----------
test("initialize: visszaadja a kért protokollverziót és az eszköz-képességet", async () => {
  const r = await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
  assert.equal(r.result.protocolVersion, "2025-03-26");
  assert.ok(r.result.capabilities.tools);
  assert.equal(r.result.serverInfo.name, "byteplus-mcp");
});

test("initialize: ismeretlen verziónál a legutóbbi támogatottat adja", async () => {
  const r = await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } });
  assert.equal(r.result.protocolVersion, "2025-06-18");
});

test("tools/list: három eszköz, handler nélkül", async () => {
  const r = await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.deepEqual(r.result.tools.map((t) => t.name), ["generate_image", "create_video", "get_video"]);
  for (const t of r.result.tools) { assert.equal(t.handler, undefined); assert.equal(t.inputSchema.type, "object"); }
});

test("értesítésre nincs válasz, ismeretlen metódusra -32601", async () => {
  assert.equal(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
  const r = await handleMessage({ jsonrpc: "2.0", id: 3, method: "nincs/ilyen" });
  assert.equal(r.error.code, -32601);
});

test("hibás argumentum: isError, nincs API-hívás", async () => {
  let r = await call("generate_image", {});
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /missing required argument: prompt/);
  r = await call("create_video", { prompt: "x", ratio: "5:1" });
  assert.equal(r.result.isError, true);
  r = await call("generate_image", { prompt: "x", foo: 1 });
  assert.match(r.result.content[0].text, /unknown argument/);
  assert.equal(calls.length, 0);
});

// ---------- kép ----------
test("generate_image: helyes kérés és URL-lista", async () => {
  replies.push({ status: 200, body: { model: "seedream-4-0-250828", data: [{ url: "https://x/1.jpeg", size: "2048x2048" }, { url: "https://x/2.jpeg", size: "2048x2048" }] } });
  const r = await call("generate_image", { prompt: "piros bögre", size: "2K", count: 2, reference_images: ["https://ref/a.png"] });
  assert.equal(r.result.isError, false);
  const c = calls[0];
  assert.equal(c.url, "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations");
  assert.equal(c.method, "POST");
  assert.equal(c.headers.Authorization, "Bearer ark-teszt");
  assert.deepEqual(c.body, {
    model: "seedream-4-0-250828", prompt: "piros bögre", response_format: "url", watermark: false, size: "2K",
    image: "https://ref/a.png", sequential_image_generation: "auto", sequential_image_generation_options: { max_images: 2 },
  });
  assert.match(r.result.content[0].text, /1\. https:\/\/x\/1\.jpeg/);
  assert.match(r.result.content[0].text, /2\. https:\/\/x\/2\.jpeg/);
});

test("generate_image: ARK_IMAGE_MODEL felülírja az alapmodellt, egy képnél nincs sorozat-paraméter", async () => {
  process.env.ARK_IMAGE_MODEL = "ep-123";
  replies.push({ status: 200, body: { data: [{ url: "https://x/1.jpeg" }] } });
  await call("generate_image", { prompt: "x" });
  assert.equal(calls[0].body.model, "ep-123");
  assert.equal(calls[0].body.sequential_image_generation, undefined);
});

test("generate_image: API-hiba olvasható üzenetként jön vissza", async () => {
  replies.push({ status: 404, body: { error: { code: "ModelNotOpen", message: "model is not activated" } } });
  const r = await call("generate_image", { prompt: "x" });
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /404.*ModelNotOpen: model is not activated/);
});

test("generate_image: hiányzó ARK_API_KEY", async () => {
  delete process.env.ARK_API_KEY;
  const r = await call("generate_image", { prompt: "x" });
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /ARK_API_KEY/);
});

test("generate_image: nem URL referenciát elutasít", async () => {
  const r = await call("generate_image", { prompt: "x", reference_images: ["C:/kep.png"] });
  assert.equal(r.result.isError, true);
  assert.equal(calls.length, 0);
});

// ---------- videó ----------
test("create_video: kapcsolók a promptban, első/utolsó képkocka", async () => {
  replies.push({ status: 200, body: { id: "cgt-abc123" } });
  const r = await call("create_video", { prompt: "lassú kameramozgás", first_frame_image: "https://i/1.png", last_frame_image: "https://i/2.png", resolution: "1080p", ratio: "9:16", duration: 5, camera_fixed: false });
  assert.equal(r.result.isError, false);
  const c = calls[0];
  assert.equal(c.url, "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks");
  assert.equal(c.body.model, "seedance-1-0-pro-250528");
  assert.deepEqual(c.body.content, [
    { type: "text", text: "lassú kameramozgás --resolution 1080p --ratio 9:16 --duration 5 --camerafixed false --watermark false" },
    { type: "image_url", image_url: { url: "https://i/1.png" }, role: "first_frame" },
    { type: "image_url", image_url: { url: "https://i/2.png" }, role: "last_frame" },
  ]);
  assert.match(r.result.content[0].text, /cgt-abc123/);
});

test("create_video: utolsó képkocka első nélkül hiba", async () => {
  const r = await call("create_video", { prompt: "x", last_frame_image: "https://i/2.png" });
  assert.equal(r.result.isError, true);
  assert.equal(calls.length, 0);
});

test("get_video: kész videó linkje", async () => {
  replies.push({ status: 200, body: { id: "cgt-abc123", status: "succeeded", content: { video_url: "https://v/1.mp4" }, resolution: "1080p", ratio: "9:16", duration: 5 } });
  const r = await call("get_video", { task_id: "cgt-abc123" });
  assert.equal(calls[0].url, "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/cgt-abc123");
  assert.match(r.result.content[0].text, /succeeded/);
  assert.match(r.result.content[0].text, /https:\/\/v\/1\.mp4/);
});

test("get_video: várakozás nélkül egyszer kérdez, hibás azonosítót elutasít", async () => {
  replies.push({ status: 200, body: { id: "cgt-1", status: "running" } });
  const r = await call("get_video", { task_id: "cgt-1" });
  assert.equal(calls.length, 1);
  assert.match(r.result.content[0].text, /Still rendering/);
  const bad = await call("get_video", { task_id: "../../x" });
  assert.equal(bad.result.isError, true);
  assert.equal(calls.length, 1);
});

test("get_video: sikertelen feladat hibaüzenete", async () => {
  replies.push({ status: 200, body: { id: "cgt-1", status: "failed", error: { code: "OutputVideoSensitiveContentDetected", message: "blocked" } } });
  const r = await call("get_video", { task_id: "cgt-1" });
  assert.match(r.result.content[0].text, /OutputVideoSensitiveContentDetected: blocked/);
});

// ---------- HTTP-végpont ----------
test("HTTP: token nélkül 401, rossz tokennel 401, MCP_TOKEN nélkül 503", async () => {
  assert.equal((await run({ url: "/api/mcp", body: { jsonrpc: "2.0", id: 1, method: "ping" } })).status, 401);
  assert.equal((await run({ url: "/api/mcp?token=rossz", body: { jsonrpc: "2.0", id: 1, method: "ping" } })).status, 401);
  delete process.env.MCP_TOKEN;
  assert.equal((await run({ body: { jsonrpc: "2.0", id: 1, method: "ping" } })).status, 503);
});

test("HTTP: Bearer fejléc is elfogadott", async () => {
  const r = await run({ url: "/api/mcp", headers: { authorization: "Bearer " + TOKEN }, body: { jsonrpc: "2.0", id: 7, method: "ping" } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { jsonrpc: "2.0", id: 7, result: {} });
});

test("HTTP: GET 405, értesítés 202, hibás JSON 400, OPTIONS 204", async () => {
  assert.equal((await run({ method: "GET" })).status, 405);
  assert.equal((await run({ body: { jsonrpc: "2.0", method: "notifications/initialized" } })).status, 202);
  const bad = await run({ body: "{nem json" });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error.code, -32700);
  assert.equal((await run({ method: "OPTIONS", url: "/api/mcp" })).status, 204);
});

test("HTTP: teljes kör — initialize, tools/list, tools/call", async () => {
  const init = await run({ body: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "claude-ai", version: "1" } } } });
  assert.equal(init.status, 200);
  assert.equal(init.json.result.protocolVersion, "2025-06-18");
  const list = await run({ body: { jsonrpc: "2.0", id: 2, method: "tools/list" } });
  assert.equal(list.json.result.tools.length, 3);
  replies.push({ status: 200, body: { data: [{ url: "https://x/1.jpeg" }] } });
  const gen = await run({ body: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "generate_image", arguments: { prompt: "macska" } } } });
  assert.equal(gen.json.result.isError, false);
});

test("HTTP: kötegelt kérés", async () => {
  const r = await run({ body: [{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", method: "notifications/initialized" }] });
  assert.equal(r.status, 200);
  assert.equal(r.json.length, 1);
});
