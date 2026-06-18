import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

[
  "daily-log-form",
  "pain-before",
  "pain-after",
  "swelling-status",
  "sharp-pain",
  "phase-completed",
  "safety-alert"
].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `page should include ${id}`);
});

assert.match(script, /const getDailyLogSnapshot = \(\)/, "script should read daily log values");
assert.match(script, /const evaluateSafetyGuardrails = \(log\)/, "script should evaluate daily safety rules");
assert.match(script, /sharpPainBlocksProgression/, "sharp pain should block progression");
assert.match(script, /swellingBlocksProgression/, "swelling should block progression");
assert.match(script, /const setupDailyLog = \(\)/, "script should bind daily log events");
