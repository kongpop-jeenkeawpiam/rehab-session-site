import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(
  html,
  /id="reset-all-sets"[^>]*>Reset all sets<\/button>/,
  "footer should include a Reset all sets button"
);

assert.match(
  script,
  /const resetAllSetRows = \(\) =>/,
  "script should define a resetAllSetRows handler"
);

assert.match(
  script,
  /getElementById\("reset-all-sets"\).*resetAllSetRows/s,
  "Reset all sets button should be wired to resetAllSetRows"
);
