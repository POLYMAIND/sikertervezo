// Az MCP-eszközök: képgenerálás, videó indítása, videó állapota.
"use strict";

const { ark, ArkError, IMAGE_MODEL, VIDEO_MODEL } = require("./ark");

const URL_RE = /^(https?:\/\/|data:image\/)/i;
const TASK_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const EXPIRY_NOTE = "Note: BytePlus result links expire after 24 hours — download anything worth keeping.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkUrls(list, field) {
  for (const u of list) {
    if (typeof u !== "string" || !URL_RE.test(u)) throw new ArkError(`${field}: only public http(s) image URLs (or data:image/... URIs) are accepted.`);
  }
}

// ---------- generate_image ----------
async function generateImage(a) {
  const body = {
    model: a.model || IMAGE_MODEL(),
    prompt: a.prompt,
    response_format: "url",
    watermark: a.watermark === true,
  };
  if (a.size) body.size = a.size;
  if (a.seed !== undefined) body.seed = a.seed;
  if (a.guidance_scale !== undefined) body.guidance_scale = a.guidance_scale;
  const refs = a.reference_images || [];
  if (refs.length) {
    checkUrls(refs, "reference_images");
    body.image = refs.length === 1 ? refs[0] : refs;
  }
  const count = a.count || 1;
  if (count > 1) {
    body.sequential_image_generation = "auto";
    body.sequential_image_generation_options = { max_images: count };
  }

  const data = await ark("/images/generations", { method: "POST", body, timeoutMs: 58000 });
  const items = Array.isArray(data.data) ? data.data : [];
  const ok = items.filter((x) => x && x.url);
  const failed = items.filter((x) => x && x.error);
  if (!ok.length) {
    const why = failed.length ? failed.map((f) => f.error.message || f.error.code).join("; ") : "empty response";
    throw new ArkError("No image was generated: " + why);
  }
  const lines = [`Generated ${ok.length} image(s) with ${data.model || body.model}:`];
  ok.forEach((x, i) => lines.push(`${i + 1}. ${x.url}${x.size ? `  (${x.size})` : ""}`));
  if (failed.length) lines.push(`${failed.length} image(s) failed: ${failed.map((f) => f.error.message || f.error.code).join("; ")}`);
  lines.push("", "Show each image to the user as a markdown image: ![image](URL).", EXPIRY_NOTE);
  return lines.join("\n");
}

// ---------- create_video ----------
async function createVideo(a) {
  const refs = a.reference_images || [];
  if (a.last_frame_image && !a.first_frame_image) throw new ArkError("last_frame_image requires first_frame_image.");
  if (refs.length && (a.first_frame_image || a.last_frame_image)) throw new ArkError("reference_images cannot be combined with first_frame_image / last_frame_image.");
  if (a.first_frame_image) checkUrls([a.first_frame_image], "first_frame_image");
  if (a.last_frame_image) checkUrls([a.last_frame_image], "last_frame_image");
  if (refs.length) checkUrls(refs, "reference_images");

  // A Seedance a paramétereket a szöveges prompt végén, --kapcsolókkal várja.
  const flags = [];
  if (a.resolution) flags.push(`--resolution ${a.resolution}`);
  if (a.ratio) flags.push(`--ratio ${a.ratio}`);
  if (a.duration !== undefined) flags.push(`--duration ${a.duration}`);
  if (a.camera_fixed !== undefined) flags.push(`--camerafixed ${a.camera_fixed ? "true" : "false"}`);
  if (a.seed !== undefined) flags.push(`--seed ${a.seed}`);
  flags.push(`--watermark ${a.watermark === true ? "true" : "false"}`);

  const content = [{ type: "text", text: `${a.prompt.trim()} ${flags.join(" ")}` }];
  if (a.first_frame_image) content.push({ type: "image_url", image_url: { url: a.first_frame_image }, role: "first_frame" });
  if (a.last_frame_image) content.push({ type: "image_url", image_url: { url: a.last_frame_image }, role: "last_frame" });
  for (const u of refs) content.push({ type: "image_url", image_url: { url: u }, role: "reference_image" });

  const body = { model: a.model || VIDEO_MODEL(), content };
  const data = await ark("/contents/generations/tasks", { method: "POST", body });
  if (!data.id) throw new ArkError("BytePlus did not return a task id.");
  return [
    `Video task started: ${data.id} (model: ${body.model}).`,
    "Rendering usually takes 1–5 minutes.",
    `Call get_video with task_id "${data.id}" (wait_seconds up to 50) to get the result.`,
  ].join("\n");
}

// ---------- get_video ----------
function formatTask(t) {
  const lines = [`Task ${t.id}: ${t.status}`];
  const c = t.content || {};
  if (t.status === "succeeded") {
    if (c.video_url) lines.push(`Video: ${c.video_url}`);
    if (c.last_frame_url) lines.push(`Last frame: ${c.last_frame_url}`);
    const meta = [t.resolution, t.ratio, t.duration ? `${t.duration}s` : null, t.seed !== undefined ? `seed ${t.seed}` : null].filter(Boolean);
    if (meta.length) lines.push(`Details: ${meta.join(", ")}`);
    lines.push("", "Give the user the video link.", EXPIRY_NOTE);
  } else if (t.status === "failed") {
    const e = t.error || {};
    lines.push(`Error: ${[e.code, e.message].filter(Boolean).join(": ") || "unknown"}`);
  } else if (t.status === "queued" || t.status === "running") {
    lines.push("Still rendering — call get_video again in a little while.");
  }
  return lines.join("\n");
}

async function getVideo(a) {
  if (!TASK_ID_RE.test(a.task_id)) throw new ArkError("Invalid task_id.");
  const waitMs = Math.min(Math.max(a.wait_seconds || 0, 0), 50) * 1000;
  const deadline = Date.now() + waitMs;
  const path = `/contents/generations/tasks/${encodeURIComponent(a.task_id)}`;
  let t = await ark(path);
  while ((t.status === "queued" || t.status === "running") && Date.now() + 5000 < deadline) {
    await sleep(5000);
    t = await ark(path);
  }
  return formatTask(t);
}

// ---------- eszközleírások ----------
const RW = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

const tools = [
  {
    name: "generate_image",
    title: "Generate image (BytePlus Seedream)",
    description:
      "Generate or edit images with BytePlus Seedream. Text-to-image from a prompt, or image editing / multi-reference composition when reference_images are given. " +
      "Returns image URLs (valid for 24 h). Reference images must be public URLs — images attached in the chat cannot be passed directly.",
    annotations: RW,
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", minLength: 1, maxLength: 4000, description: "What to create or how to change the reference image(s). Any language; English or Chinese works best." },
        reference_images: { type: "array", items: { type: "string" }, maxItems: 10, description: "Optional public image URLs to edit or use as references." },
        size: { type: "string", description: "Seedream 4.x: '1K', '2K', '4K' or 'WIDTHxHEIGHT' (e.g. '2048x2048', '1440x2560' for 9:16, '2560x1440' for 16:9). Default: model default." },
        count: { type: "integer", minimum: 1, maximum: 6, description: "Number of related images (e.g. a consistent series). Default 1. Values above 1 need Seedream 4.x." },
        seed: { type: "integer", minimum: -1, maximum: 2147483647, description: "Optional seed for reproducibility." },
        guidance_scale: { type: "number", minimum: 1, maximum: 10, description: "Optional prompt adherence (older Seedream/SeedEdit models only)." },
        watermark: { type: "boolean", description: "Add the 'AI generated' watermark. Default false." },
        model: { type: "string", description: "Optional model ID or endpoint ID (ep-...) from the ModelArk console. Default: server setting." },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
    handler: generateImage,
  },
  {
    name: "create_video",
    title: "Start video (BytePlus Seedance)",
    description:
      "Start a BytePlus Seedance video generation: text-to-video, image-to-video (first frame, optionally last frame) or reference-image video. " +
      "Returns a task_id immediately; then call get_video to fetch the finished video. Images must be public URLs.",
    annotations: RW,
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", minLength: 1, maxLength: 4000, description: "Scene, subject, motion and camera description." },
        first_frame_image: { type: "string", description: "Optional public image URL used as the first frame (image-to-video)." },
        last_frame_image: { type: "string", description: "Optional public image URL for the last frame (needs first_frame_image)." },
        reference_images: { type: "array", items: { type: "string" }, maxItems: 4, description: "Optional 1–4 reference image URLs (only on models that support it, e.g. Seedance lite)." },
        resolution: { type: "string", enum: ["480p", "720p", "1080p"], description: "Default: model default." },
        ratio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"], description: "Aspect ratio. Use 9:16 for Reels/TikTok. 'adaptive' follows the input image." },
        duration: { type: "integer", minimum: 2, maximum: 12, description: "Length in seconds (most models: 5 or 10)." },
        camera_fixed: { type: "boolean", description: "Keep the camera still." },
        seed: { type: "integer", minimum: -1, maximum: 4294967295, description: "Optional seed." },
        watermark: { type: "boolean", description: "Add watermark. Default false." },
        model: { type: "string", description: "Optional model ID or endpoint ID (ep-...). Default: server setting." },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
    handler: createVideo,
  },
  {
    name: "get_video",
    title: "Get video result",
    description: "Check a Seedance video task started with create_video. Optionally waits up to wait_seconds (max 50) for it to finish. Returns the video URL when done.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "The task_id returned by create_video." },
        wait_seconds: { type: "integer", minimum: 0, maximum: 50, description: "Wait up to this many seconds for completion. Default 0 (just check)." },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
    handler: getVideo,
  },
];

module.exports = { tools, generateImage, createVideo, getVideo, formatTask };
