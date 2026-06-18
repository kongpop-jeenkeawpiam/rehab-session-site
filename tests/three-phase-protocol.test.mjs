import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

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
