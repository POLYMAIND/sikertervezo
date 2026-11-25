// Az iOS-app webes tartalma: a build-www az appnak szóló fájlokat másolja, a mérőkódokat és a PWA-leírót kihagyja.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const here = path.dirname(new URL(import.meta.url).pathname), www = path.resolve(here, "../www");

test("build-www", () => {
  execFileSync(process.execPath, [path.resolve(here, "../scripts/build-www.mjs")]);
  const html = fs.readFileSync(path.join(www, "index.html"), "utf8");
  assert.ok(!/_vercel\/insights|consent\.js|rel="manifest"/.test(html));
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(scripts[0], "/js/native.js", "a native.js töltődjön be elsőnek");
  for (const s of scripts) assert.ok(fs.existsSync(path.join(www, s)), "hiányzik: " + s);
  for (const l of [...html.matchAll(/<link rel="stylesheet" href="(\/[^"]+)"/g)].map((m) => m[1])) assert.ok(fs.existsSync(path.join(www, l)), "hiányzik: " + l);
  assert.ok(!fs.existsSync(path.join(www, "sw.js")));
  assert.ok(fs.statSync(path.join(www, "vendor/supabase.min.js")).size > 50000);
});
