import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

[
  "assessment-form",
  "pain-level",
  "injury-history",
  "commitment-days",
  "support-available",
  "weekly-schedule-panel",
  "weekly-schedule-list"
].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `page should include ${id}`);
});

[
  "assessment",
  "weeklySchedule",
  "profileLastUpdated"
].forEach((key) => {
  assert.match(script, new RegExp(`${key}: "kneeRehab`), `STORAGE_KEYS should include ${key}`);
});

assert.match(script, /const getAssessmentSnapshot = \(\)/, "script should read assessment form values");
assert.match(script, /const generateWeeklySchedule = \(assessment\)/, "script should generate a weekly schedule");
assert.match(script, /const renderWeeklySchedule = \(\)/, "script should render the schedule");
assert.match(script, /const setupAssessment = \(\)/, "script should bind assessment events");
