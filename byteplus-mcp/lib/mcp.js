// Minimális, állapotmentes MCP-szerver (Streamable HTTP, sima JSON-válaszokkal).
// Nincs külső függőség: a JSON-RPC üzeneteket itt kezeljük.
"use strict";

const { tools } = require("./tools");
const { ArkError } = require("./ark");

const SERVER_INFO = { name: "byteplus-mcp", title: "BytePlus kép és videó", version: "0.1.0" };
const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST = "2025-06-18";
const INSTRUCTIONS =
  "BytePlus ModelArk image (Seedream) and video (Seedance) generation. " +
  "Images: call generate_image and show the returned URLs as markdown images. " +
  "Videos: call create_video, then get_video with wait_seconds=50 (repeat until it succeeds). " +
  "All result links expire after 24 hours.";

const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

// Egyszerű sémaellenőrzés a fenti eszközsémákhoz (kötelező mezők, típus, enum, határok).
function validate(schema, args) {
  if (args === null || typeof args !== "object" || Array.isArray(args)) return "arguments must be an object";
  for (const k of schema.required || []) if (args[k] === undefined) return `missing required argument: ${k}`;
  for (const [k, v] of Object.entries(args)) {
    const p = schema.properties[k];
    if (!p) return `unknown argument: ${k}`;
    if (v === undefined || v === null) { delete args[k]; continue; }
    if (p.type === "string") {
      if (typeof v !== "string") return `${k} must be a string`;
      if (p.minLength && v.trim().length < p.minLength) return `${k} must not be empty`;
      if (p.maxLength && v.length > p.maxLength) return `${k} is too long (max ${p.maxLength})`;
    } else if (p.type === "integer") {
      if (!Number.isInteger(v)) return `${k} must be an integer`;
    } else if (p.type === "number") {
      if (typeof v !== "number" || !Number.isFinite(v)) return `${k} must be a number`;
    } else if (p.type === "boolean") {
      if (typeof v !== "boolean") return `${k} must be true or false`;
    } else if (p.type === "array") {
      if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) return `${k} must be a list of strings`;
      if (p.maxItems && v.length > p.maxItems) return `${k}: at most ${p.maxItems} items`;
    }
    if (p.enum && !p.enum.includes(v)) return `${k} must be one of: ${p.enum.join(", ")}`;
    if (p.minimum !== undefined && v < p.minimum) return `${k} must be >= ${p.minimum}`;
    if (p.maximum !== undefined && v > p.maximum) return `${k} must be <= ${p.maximum}`;
  }
  return null;
}

const publicTool = ({ handler, ...t }) => t;

// Egy JSON-RPC üzenet feldolgozása. null = nincs válasz (értesítés vagy kliens-válasz).
async function handleMessage(msg) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return fail(null, -32600, "Invalid Request");
  const hasId = msg.id !== undefined && msg.id !== null;
  if (typeof msg.method !== "string") return null; // a klienstől érkező válaszokat figyelmen kívül hagyjuk
  if (!hasId) return null; // értesítés (pl. notifications/initialized)

  const id = msg.id;
  const params = msg.params || {};
  switch (msg.method) {
    case "initialize": {
      const v = SUPPORTED_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : LATEST;
      return ok(id, { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: tools.map(publicTool) });
    case "tools/call": {
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${params.name}`);
      const args = Object.assign({}, params.arguments || {});
      const bad = validate(tool.inputSchema, args);
      if (bad) return ok(id, { content: [{ type: "text", text: `Invalid arguments: ${bad}` }], isError: true });
      try {
        const text = await tool.handler(args);
        return ok(id, { content: [{ type: "text", text }], isError: false });
      } catch (e) {
        const text = e instanceof ArkError ? e.message : "Unexpected server error.";
        if (!(e instanceof ArkError)) console.error("tool error", tool.name, e);
        return ok(id, { content: [{ type: "text", text }], isError: true });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${msg.method}`);
  }
}

module.exports = { handleMessage, validate, SUPPORTED_VERSIONS, SERVER_INFO };
