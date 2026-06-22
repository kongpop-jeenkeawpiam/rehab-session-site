import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

[
  "todays-summary-heading",
  "todays-summary-date",
  "todays-summary-text",
  "summary-mark-today-complete",
  "copy-session-summary",
  "copy-session-summary-status"
].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `page should include ${id}`);
});

assert.match(html, /id="todays-summary-heading">Session Summary</);
assert.match(html, /id="summary-mark-today-complete"[^>]*>Mark Complete</);
assert.match(script, /"todaySummary\.heading": "Session Summary"/);
assert.match(script, /"todaySummary\.heading": "สรุปเซสชัน"/);
assert.match(script, /"todaySummary\.pending": "Your summary will appear after you mark this session complete\."/);
assert.match(script, /"todaySummary\.copy": "Copy to Clipboard"/);
assert.match(script, /"todaySummary\.copied": "Copied"/);
assert.match(script, /"todaySummary\.copyFailed": "Could not copy summary"/);

assert.match(
  html,
  /id="todays-summary-text"[^>]*aria-live="polite"/,
  "summary text should announce its generated result"
);

[
  "todaySummary.heading",
  "todaySummary.pending",
  "todaySummary.completed",
  "todaySummary.completedLegacy",
  "todaySummary.exerciseSets",
  "todaySummary.joinTwo",
  "todaySummary.joinMany"
].forEach((key) => {
  const occurrences = script.match(new RegExp(`"${key}"`, "g")) || [];
  assert.ok(occurrences.length >= 2, `${key} should have English and Thai translations`);
});

assert.match(script, /selector: "#todays-summary-heading", key: "todaySummary\.heading"/);
assert.match(
  script,
  /const renderSelectedSessionCompletionButton = \(\) =>/,
  "bottom completion button should have selected-session rendering"
);
assert.match(
  script,
  /getElementById\("summary-mark-today-complete"\)\?\.addEventListener\("click", \(\) => \{[\s\S]*?toggleDateCompletion\(dateKey\)/,
  "bottom completion button should complete the selected date"
);
assert.match(
  script,
  /const renderSelectedDay = \(\) => \{[\s\S]*?renderSelectedSessionSummary\(\);[\s\S]*?\n\};/,
  "selected-day rendering should also refresh the text summary"
);

const storage = new Map();
const summaryDate = { textContent: "" };
const summaryText = { textContent: "" };
const headerCompleteButton = { disabled: false, textContent: "" };
const summaryCompleteButton = { disabled: false, textContent: "" };
const copyButton = { disabled: false, textContent: "" };
const copyStatus = { textContent: "" };
const elements = {
  "todays-summary-date": summaryDate,
  "todays-summary-text": summaryText,
  "mark-today-complete": headerCompleteButton,
  "summary-mark-today-complete": summaryCompleteButton,
  "copy-session-summary": copyButton,
  "copy-session-summary-status": copyStatus
};
const copiedTexts = [];
const navigator = {
  language: "en-US",
  clipboard: {
    writeText: async (value) => copiedTexts.push(value)
  }
};
const context = {
  console: console,
  Date: Date,
  Intl: Intl,
  JSON: JSON,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    title: "",
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: (id) => elements[id] || null
  },
  window: {
    matchMedia: () => ({ matches: false }),
    navigator: navigator
  },
  navigator: navigator
};

await vm.runInNewContext(`${script}
const summaryRecord = {
  completed: true,
  exercises: {
    slr: { completedSets: 2, totalSets: 3 },
    wall: { completedSets: 1, totalSets: 2 },
    bridge: { completedSets: 0, totalSets: 3 }
  },
  setRows: {
    "slr-1": { isDone: true, totalReps: 15, workDurationSec: 5 },
    "slr-2": { isDone: true, totalReps: 15, workDurationSec: 5 },
    "slr-3": { isDone: false, totalReps: 15, workDurationSec: 5 },
    "wall-1": { isDone: true, totalReps: 5, workDurationSec: 20 },
    "wall-2": { isDone: false, totalReps: 5, workDurationSec: 20 }
  },
  checklist: { sentinel: "CHECKLIST MUST NOT APPEAR" },
  notes: "NOTES MUST NOT APPEAR"
};
const parts = getTodaySummaryExerciseParts(summaryRecord);
assert.equal(
  JSON.stringify(parts),
  JSON.stringify([
    "Straight Leg Raise (2 of 3 sets, 30 of 45 reps)",
    "Wall Sit (1 of 2 sets, 5 of 10 reps, 20 seconds per rep)"
  ])
);
const summary = createTodaySummaryText(summaryRecord, "2026-06-22");
assert.ok(summary.includes("Straight Leg Raise (2 of 3 sets, 30 of 45 reps) and Wall Sit (1 of 2 sets, 5 of 10 reps, 20 seconds per rep)"));
assert.doesNotMatch(summary, /Session time|12:34/);
assert.doesNotMatch(summary, /CHECKLIST MUST NOT APPEAR|NOTES MUST NOT APPEAR/);
const legacySummary = createTodaySummaryText({ completed: true, exercises: {} }, "2026-06-22");
assert.match(legacySummary, /without detailed exercise data/);

const selectedKey = "2026-06-21";
calendarState.selectedDateKey = selectedKey;
calendarState.completedDates = new Set();
renderSelectedSessionSummary();
assert.equal(summaryText.textContent, "Your summary will appear after you mark this session complete.");

calendarState.sessionHistory[selectedKey] = summaryRecord;
calendarState.completedDates.add(selectedKey);
renderSelectedSessionSummary();
assert.match(summaryDate.textContent, /June 21, 2026/);
assert.doesNotMatch(summaryText.textContent, /Session time|12:34/);

calendarState.completedDates.clear();
renderSelectedSessionCompletionButton();
assert.equal(summaryCompleteButton.textContent, "Mark Complete");
assert.equal(summaryCompleteButton.disabled, false);

calendarState.completedDates.add(selectedKey);
renderSelectedSessionCompletionButton();
assert.equal(summaryCompleteButton.textContent, "Completed");
assert.equal(summaryCompleteButton.disabled, true);

calendarState.selectedDateKey = "2026-06-23";
renderSelectedSessionCompletionButton();
assert.equal(summaryCompleteButton.disabled, true);

calendarState.selectedDateKey = selectedKey;
calendarState.completedDates.clear();
renderSessionSummaryCopyButton();
assert.equal(copyButton.disabled, true);

calendarState.completedDates.add(selectedKey);
renderSelectedSessionSummary();
renderSessionSummaryCopyButton();
assert.equal(copyButton.disabled, false);
copySelectedSessionSummary();
`, {
  ...context,
  assert: assert,
  summaryDate: summaryDate,
  summaryText: summaryText,
  headerCompleteButton: headerCompleteButton,
  summaryCompleteButton: summaryCompleteButton,
  copyButton: copyButton
});

assert.equal(copiedTexts.length, 1);
assert.equal(copiedTexts[0], summaryText.textContent);
assert.equal(copyStatus.textContent, "Copied");
