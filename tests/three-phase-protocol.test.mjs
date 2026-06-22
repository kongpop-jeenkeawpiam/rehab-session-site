import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

const exerciseHeadingOrder = Array.from(
  html.matchAll(/<h2 id="(quad-set|slr|bridge|clam|side-leg-lift|wall-sit|chair-squat|mini-single-leg-squat)-heading">/g),
  ([, id]) => id
);

assert.deepEqual(
  exerciseHeadingOrder,
  [
    "quad-set",
    "slr",
    "bridge",
    "clam",
    "side-leg-lift",
    "wall-sit",
    "chair-squat",
    "mini-single-leg-squat"
  ],
  "exercise cards should appear in protocol order"
);

[
  "phase-1-foundation",
  "phase-2-static-load",
  "phase-3-dynamic-control"
].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `page should render ${id}`);
});

[
  "quad-set",
  "slr",
  "bridge",
  "clam",
  "side-leg-lift",
  "wall",
  "chair-squat",
  "mini-single-leg-squat"
].forEach((exerciseId) => {
  assert.match(script, new RegExp(`id: "${exerciseId}"`), `script should define ${exerciseId}`);
});

assert.match(script, /const REHAB_PHASES = \[/, "script should define phase data");
assert.match(script, /const REHAB_EXERCISES = \[/, "script should define exercise data");
assert.match(script, /const PROGRESSION_RULES = {/, "script should define progression rules");

assert.match(
  script,
  /id: "wall"[^\n]+setIds: \["wall-1", "wall-2"\][^\n]+target: "2 sets, 5 reps, 20 seconds"/,
  "Wall Sit should define two sets of five 20-second reps"
);
assert.match(
  script,
  /wall: \{ totalReps: 5, workDurationSec: 20,[^\n]+activeTargetPrefix: "Rep" \}/,
  "Wall Sit timer should run five 20-second reps per set"
);
assert.match(html, /id="wall-progress-sets">0 \/ 2</, "Wall Sit progress should start at zero of two sets");
assert.match(html, /id="wall-set-total">2</, "Wall Sit tracker should contain two sets");
assert.deepEqual(
  Array.from(html.matchAll(/data-set-row="(wall-\d+)"/g), ([, id]) => id),
  ["wall-1", "wall-2"],
  "Wall Sit should render exactly two set rows"
);
assert.match(html, /Wall Sit, 2 sets, 5 reps, 20 seconds/, "phase summary should show the Wall Sit dosage");
assert.match(
  script,
  /const dosageChanged =[^;]+;/,
  "stored set rows should detect dosage changes"
);
assert.match(
  script,
  /setRowState\[set\.id\]\.totalReps = totalReps;/,
  "restored set rows should use the current repetition count"
);
assert.match(
  script,
  /setRowState\[set\.id\]\.workDurationSec = workDurationSec;/,
  "restored set rows should use the current hold duration"
);

const exerciseBlocks = script.matchAll(/\{ id: "([^"]+)"[\s\S]*?setIds: \[([^\]]*)\][\s\S]*?checkIds: \[([^\]]*)\][\s\S]*?\}/g);
const exercises = Array.from(exerciseBlocks, ([, id, setList, checkList]) => ({
  id,
  setIds: Array.from(setList.matchAll(/"([^"]+)"/g), ([, setId]) => setId),
  checkIds: Array.from(checkList.matchAll(/"([^"]+)"/g), ([, checkId]) => checkId)
}));

assert.equal(exercises.length, 8, "script should define all eight protocol exercises");

exercises.forEach((exercise) => {
  exercise.checkIds.forEach((checkId) => {
    assert.match(
      html,
      new RegExp(`<input[^>]+id="${checkId}"[^>]+data-checklist-item`),
      `${exercise.id} check ${checkId} should render a checklist input`
    );
  });

  exercise.setIds.forEach((setId) => {
    assert.match(
      html,
      new RegExp(`data-set-row="${setId}"`),
      `${exercise.id} set ${setId} should render a set row`
    );
  });
});
