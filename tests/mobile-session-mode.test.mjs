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
  html,
  /<section[^>]*class="[^"]*\bcalendar-card\b[^"]*\bmobile-home-calendar\b[^"]*"[^>]*aria-labelledby="calendar-heading"/,
  "completion calendar should be marked for display on the initial mobile screen"
);

const todaySummarySectionMatch = html.match(
  /<section[^>]*aria-labelledby="todays-summary-heading"[^>]*>/
);
assert.ok(todaySummarySectionMatch, "page should include the session summary section");
assert.doesNotMatch(
  todaySummarySectionMatch[0],
  /\bmobile-secondary\b/,
  "session summary should not be hidden behind More on the initial mobile screen"
);

assert.match(
  styles,
  /body\.mobile-session-ready:not\(\.mobile-more-open\)\s+\.hero\s*\{\s*display:\s*contents;/,
  "mobile default view should expose the completion calendar from hero without showing secondary hero panels"
);

assert.match(
  styles,
  /body\.mobile-session-ready:not\(\.mobile-more-open\)\s+\.hero\s*>\s*:not\(\.mobile-home-calendar\)\s*\{\s*display:\s*none;/,
  "non-calendar hero children should stay hidden until More is opened on mobile"
);

assert.match(
  styles,
  /body\.mobile-session-ready:not\(\.mobile-more-open\)\s+\.mobile-home-calendar\s*\{[^}]*order:\s*3;/s,
  "completion calendar should appear on the initial mobile screen below the active exercise"
);

assert.match(
  styles,
  /body\.mobile-session-ready:not\(\.mobile-more-open\)\s+\.today-summary-card\s*\{[^}]*order:\s*4;/s,
  "session summary should appear on the initial mobile screen below the completion calendar"
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
