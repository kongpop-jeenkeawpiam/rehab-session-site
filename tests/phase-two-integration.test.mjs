import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const storage = new Map();
const elements = new Map();
const makeElement = () => ({ dataset: {}, innerHTML: "", append() {} });
["phase-two-panel", "original-program-tab", "phase-two-tab"].forEach(id => elements.set(id, makeElement()));
elements.set("session-notes", { value: "" });
const context = vm.createContext({
  assert, console, Date, Intl, Set, Map,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  window: {},
  document: {
    createElement: makeElement,
    getElementById: id => elements.get(id) ?? null,
    querySelector: selector => selector === ".exercise-progress-list" ? makeElement() : null,
    querySelectorAll: () => [],
    addEventListener() {}
  }
});
vm.runInContext(readFileSync(new URL("../phase-two.js", import.meta.url), "utf8"), context);
const program = context.window.KNEE_REHAB_PHASE_TWO;
assert.equal(program.exercises.length, 4);
assert.equal(program.exercises.flatMap(exercise => exercise.setIds).length, 12);
for (const exercise of program.exercises) {
  for (const id of exercise.checkIds) elements.set(id, { id, checked: false });
}
elements.set("monitor-immediate", { id: "monitor-immediate", checked: false });
vm.runInContext(readFileSync(new URL("../script.js", import.meta.url), "utf8"), context);
vm.runInContext(`
  const dateKey = "2026-10-03";
  calendarState.selectedDateKey = dateKey;
  activeProgram = "phaseTwo";
  const exercise = REHAB_EXERCISES.find(item => item.id === "p2-chair");
  exercise.setIds.forEach(id => { setRowState[id].isDone = true; });
  exercise.checkIds.forEach(id => { document.getElementById(id).checked = true; });
  assert.equal(getChecklistStats().completed, 3);
  assert.equal(getChecklistStats().total, 13);
  assert.equal(hasFinishedExercise(), true);
  activeProgram = "original";
  assert.equal(hasFinishedExercise(), false, "Phase 2 cannot satisfy original program completion");
  const record = createCurrentSessionHistoryRecord(dateKey);
  assert.equal(record.setRows["p2-chair-1"].isDone, true);
  assert.equal(record.checklist["p2-chair-control"], true);
  assert.equal(record.exercises["p2-chair"].completedSets, 2);
  calendarState.sessionHistory[dateKey] = record;
  syncState.user = { id: "test-user" };
  const cloudRow = createSupabaseRow(dateKey);
  assert.equal(cloudRow.set_rows["p2-chair-1"].isDone, true);
  assert.equal(cloudRow.checklist["p2-chair-control"], true);
  applySetRowsSnapshot({});
  applyChecklistSnapshot({});
  assert.equal(getSetRowState("p2-chair-1").isDone, false);
  applySetRowsSnapshot(record.setRows);
  applyChecklistSnapshot(record.checklist);
  assert.equal(getSetRowState("p2-chair-1").isDone, true);
  assert.equal(document.getElementById("p2-chair-control").checked, true);
  const legacyKey = "kneeRehabPhaseTwoSessionsV1";
  localStorage.setItem(legacyKey, JSON.stringify({
    "2026-10-02": { "split-1": true, notes: "legacy note" }
  }));
  migrateLegacyPhaseTwo();
  const migrated = calendarState.sessionHistory["2026-10-02"];
  assert.equal(migrated.setRows["p2-split-1"].isDone, true);
  assert.equal(migrated.setRows["p2-split-3"].isDone, true);
  assert.equal(migrated.exercises["p2-split"].completedSets, 2);
  assert.equal(migrated.notes, "legacy note");
  migrateLegacyPhaseTwo();
  assert.equal(migrated.notes, "legacy note", "migration must not duplicate notes");
  assert.ok(localStorage.getItem(legacyKey), "keep a recoverable legacy backup");
`, context);
console.log("Phase 2 shared state, program isolation, sync payload and migration verified");
