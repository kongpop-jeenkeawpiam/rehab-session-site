import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

["session-timer", "timer-toggle", "timer-reset"].forEach((id) => {
  assert.doesNotMatch(html, new RegExp(`id="${id}"`), `page should not include ${id}`);
  assert.doesNotMatch(script, new RegExp(`"#${id}"`), `script should not reference ${id}`);
});

assert.doesNotMatch(script, /kneeRehabTimerState/);
assert.doesNotMatch(script, /const timerState\s*=/);
assert.doesNotMatch(script, /\bsetupTimer\s*\(/);
assert.doesNotMatch(script, /\brenderTimer\s*\(/);
assert.doesNotMatch(script, /\bclearTimerInterval\s*\(/);
assert.doesNotMatch(styles, /#session-timer/);

assert.match(html, /class="set-play-button"/, "individual set timers should remain available");
assert.match(script, /const setRowState\s*=/, "individual set timer state should remain available");

const createSupabaseRowBody = script.match(
  /const createSupabaseRow = \(dateKey\) => \{([\s\S]*?)\n\};/
)?.[1];
assert.ok(createSupabaseRowBody, "script should define createSupabaseRow");
assert.doesNotMatch(createSupabaseRowBody, /\btimer\s*:/, "Supabase rows should omit session timer data");

const historyRecordBody = script.match(
  /const createCurrentSessionHistoryRecord = \(dateKey, options = \{\}\) => \{([\s\S]*?)\n\};/
)?.[1];
assert.ok(historyRecordBody, "script should define createCurrentSessionHistoryRecord");
assert.doesNotMatch(historyRecordBody, /\btimer\s*:/, "session history should omit session timer data");
