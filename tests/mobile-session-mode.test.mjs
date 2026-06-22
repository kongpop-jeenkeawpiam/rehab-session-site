import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.match(
  html,
  /id="mobile-session-overview"[\s\S]*id="mobile-session-more"[\s\S]*id="mobile-session-step-list"/,
  "mobile session overview should expose progress, exercise selection, and More controls"
);

assert.match(
  html,
  /id="mobile-session-navigation"[\s\S]*id="mobile-session-previous"[\s\S]*id="mobile-session-position"[\s\S]*id="mobile-session-next"/,
  "mobile session navigation should expose Previous, position, and Next controls"
);

assert.equal(
  (html.match(/data-mobile-step=/g) || []).length,
  9,
  "all eight exercises and monitoring should be mobile session steps"
);

assert.match(
  styles,
  /@media \(max-width: 699px\)[\s\S]*\.mobile-session-navigation[\s\S]*env\(safe-area-inset-bottom\)/,
  "mobile session mode should use the approved breakpoint and safe-area-aware navigation"
);

assert.match(
  script,
  /const setupMobileSessionMode = \(\) =>/,
  "script should initialize mobile session mode"
);

assert.doesNotMatch(
  script,
  /renderMobileSessionStepList[\s\S]*list\.replaceChildren\(\)/,
  "timer renders should update stable step buttons without resetting horizontal scroll"
);

const context = {
  console,
  Date,
  Intl,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  Set,
  Map,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  window: {}
};

vm.runInNewContext(`${script}
assert.equal(findFirstIncompleteMobileStep([true, false, false]), 1);
assert.equal(findFirstIncompleteMobileStep([true, true, true]), 3);
assert.equal(findNextIncompleteMobileStep([true, true, false, false], 0), 2);
assert.equal(findNextIncompleteMobileStep([true, true, true], 1), 3);
`, { ...context, assert });
