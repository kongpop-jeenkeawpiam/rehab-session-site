import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(
  script,
  /const getActiveDateKey = \(\)/,
  "script should expose an active selected date helper"
);

assert.match(
  script,
  /const saveActiveSessionHistory = \(/,
  "script should save full progress for the selected date"
);

assert.match(
  script,
  /const applySessionRecordToCurrentView = \(/,
  "script should load a selected date record into the main tracker"
);

assert.match(
  script,
  /selectCalendarDate[\s\S]*applySelectedDateSession/,
  "selecting a calendar date should load that date into the tracker"
);

assert.match(
  script,
  /createSupabaseRow[\s\S]*dateKey === getActiveDateKey\(\)/,
  "Supabase rows should include full session detail for the active selected date, not only today"
);
