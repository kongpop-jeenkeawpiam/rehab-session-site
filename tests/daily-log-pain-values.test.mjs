import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(
  html,
  /id="pain-before"[^>]*required/,
  "pain before should be required"
);

assert.match(
  html,
  /id="pain-after"[^>]*required/,
  "pain after should be required"
);

assert.match(
  script,
  /const readRequiredPainValue = \(elementId\)/,
  "script should parse required pain fields without blank-to-zero coercion"
);

assert.match(
  script,
  /painBefore: readRequiredPainValue\("pain-before"\)/,
  "pain before should use required pain parsing"
);

assert.match(
  script,
  /painAfter: readRequiredPainValue\("pain-after"\)/,
  "pain after should use required pain parsing"
);

assert.match(
  script,
  /Enter pain before and after the session to evaluate safety\./,
  "missing pain values should show a clear safety message"
);
