# Exercise Set Timers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workout-style per-set timer rows so Wall Sit tracks 2 sets and Straight Leg Raise tracks 3 sets, matching the pattern shown in `docs/example.jpg`.

**Architecture:** Keep the site static and dependency-free. Each exercise gets a compact set table with numbered rows, a timer field, a target field, and a play/pause button per set. JavaScript stores per-set elapsed/completed/running state in `localStorage`; the existing whole-session timer stays separate.

**Tech Stack:** HTML, CSS, vanilla JavaScript, `localStorage`, `setInterval`, `Date.now()`.

---

## Example Reference

`docs/example.jpg` shows the intended interaction pattern:

- A workout card per exercise.
- A header showing exercise name and total sets.
- Numbered set rows.
- A timer/weight-style field per row.
- A target reps field per row.
- A play button per set row.
- Only the active row timer should run.

This plan adapts that layout to the current rehab site without copying the dark mobile app styling.

## Files

- Modify `index.html`: add per-set rows inside the Wall Sit and Straight Leg Raise exercise sections.
- Modify `styles.css`: style the set rows as compact workout-style rows that wrap on mobile.
- Modify `script.js`: add set-row configuration, persisted state, rendering, per-row timer controls, and reset behavior.
- Optional modify `README.md`: document per-set timers.

## Product Decisions

- Wall Sit has 2 set rows. Each row target is `30 sec hold`.
- Straight Leg Raise has 3 set rows. Each row target is `15 reps`.
- A set row play button starts that row’s timer. Pressing it again pauses the row.
- Starting a set row pauses any other running set row.
- Completing a set is explicit: each row has a compact `Done` checkbox so a timer can be used without forcing completion.
- Exercise set count is derived from completed set rows, for example `1 / 2 sets`.
- Resetting an exercise’s sets clears only that exercise’s row timers and completed states.
- The existing session timer remains unchanged and independent.
- `Reset Checklist` should not reset set rows.

## Tasks

### Task 1: Add Workout-Style Set Row Markup

**Files:**
- Modify: `index.html`

- [ ] In the Wall Sit section, immediately after the `.section-heading.compact` block and before the Wall Sit checklist, add:

```html
<div class="set-tracker" data-set-tracker="wall" role="group" aria-labelledby="wall-set-heading">
  <div class="set-tracker-header">
    <div>
      <h3 id="wall-set-heading">Wall Sit Sets</h3>
      <p><span id="wall-set-count">0</span> / <span id="wall-set-total">2</span> sets</p>
    </div>
    <button type="button" id="wall-set-reset" class="button secondary-button">Reset Sets</button>
  </div>

  <div class="set-row" data-set-row="wall-1">
    <span class="set-number" aria-label="Set 1">1</span>
    <span id="wall-set-1-timer" class="set-time" aria-live="polite">00:00</span>
    <span class="set-target">30 sec hold</span>
    <button type="button" id="wall-set-1-toggle" class="set-play-button" aria-label="Start Wall Sit set 1">▶</button>
    <label class="set-done">
      <input type="checkbox" id="wall-set-1-done" />
      <span>Done</span>
    </label>
  </div>

  <div class="set-row" data-set-row="wall-2">
    <span class="set-number" aria-label="Set 2">2</span>
    <span id="wall-set-2-timer" class="set-time" aria-live="polite">00:00</span>
    <span class="set-target">30 sec hold</span>
    <button type="button" id="wall-set-2-toggle" class="set-play-button" aria-label="Start Wall Sit set 2">▶</button>
    <label class="set-done">
      <input type="checkbox" id="wall-set-2-done" />
      <span>Done</span>
    </label>
  </div>
</div>
```

- [ ] In the Straight Leg Raise section, immediately after the `.section-heading.compact` block and before the SLR checklist, add:

```html
<div class="set-tracker" data-set-tracker="slr" role="group" aria-labelledby="slr-set-heading">
  <div class="set-tracker-header">
    <div>
      <h3 id="slr-set-heading">Straight Leg Raise Sets</h3>
      <p><span id="slr-set-count">0</span> / <span id="slr-set-total">3</span> sets</p>
    </div>
    <button type="button" id="slr-set-reset" class="button secondary-button">Reset Sets</button>
  </div>

  <div class="set-row" data-set-row="slr-1">
    <span class="set-number" aria-label="Set 1">1</span>
    <span id="slr-set-1-timer" class="set-time" aria-live="polite">00:00</span>
    <span class="set-target">15 reps</span>
    <button type="button" id="slr-set-1-toggle" class="set-play-button" aria-label="Start Straight Leg Raise set 1">▶</button>
    <label class="set-done">
      <input type="checkbox" id="slr-set-1-done" />
      <span>Done</span>
    </label>
  </div>

  <div class="set-row" data-set-row="slr-2">
    <span class="set-number" aria-label="Set 2">2</span>
    <span id="slr-set-2-timer" class="set-time" aria-live="polite">00:00</span>
    <span class="set-target">15 reps</span>
    <button type="button" id="slr-set-2-toggle" class="set-play-button" aria-label="Start Straight Leg Raise set 2">▶</button>
    <label class="set-done">
      <input type="checkbox" id="slr-set-2-done" />
      <span>Done</span>
    </label>
  </div>

  <div class="set-row" data-set-row="slr-3">
    <span class="set-number" aria-label="Set 3">3</span>
    <span id="slr-set-3-timer" class="set-time" aria-live="polite">00:00</span>
    <span class="set-target">15 reps</span>
    <button type="button" id="slr-set-3-toggle" class="set-play-button" aria-label="Start Straight Leg Raise set 3">▶</button>
    <label class="set-done">
      <input type="checkbox" id="slr-set-3-done" />
      <span>Done</span>
    </label>
  </div>
</div>
```

- [ ] Run `python3 -m http.server 8000` and verify each exercise section shows numbered set rows like the example image.

### Task 2: Style Set Rows

**Files:**
- Modify: `styles.css`

- [ ] Add these styles near the checklist/card styles:

```css
.set-tracker {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.95rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #f8fbff;
}

.set-tracker-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.set-tracker-header h3,
.set-tracker-header p {
  margin: 0;
}

.set-tracker-header p {
  color: var(--muted);
  font-weight: 800;
}

.set-row {
  display: grid;
  grid-template-columns: 2.75rem minmax(5.75rem, 1fr) minmax(6.5rem, 1fr) 3rem auto;
  gap: 0.55rem;
  align-items: center;
}

.set-number,
.set-time,
.set-target,
.set-play-button {
  min-height: 46px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
}

.set-number,
.set-time,
.set-target,
.set-play-button {
  display: grid;
  place-items: center;
}

.set-number {
  color: var(--text);
  font-weight: 900;
}

.set-time,
.set-target {
  padding: 0 0.75rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.set-target {
  color: var(--muted);
}

.set-play-button {
  color: #ffffff;
  background: var(--primary);
  cursor: pointer;
  font-weight: 900;
}

.set-done {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  color: var(--muted);
  font-weight: 800;
}

.set-row.completed .set-number,
.set-row.completed .set-time,
.set-row.completed .set-target {
  border-color: rgba(22, 163, 74, 0.35);
  background: var(--success-soft);
  color: #14532d;
}

.button:disabled,
.set-play-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}
```

- [ ] Add this mobile override before the existing `@media (min-width: 700px)` block:

```css
@media (max-width: 520px) {
  .set-row {
    grid-template-columns: 2.75rem 1fr 3rem;
  }

  .set-target,
  .set-done {
    grid-column: 2 / -1;
  }
}
```

- [ ] Verify at `375px` width that the row controls do not create horizontal scrolling.

### Task 3: Add Per-Set State and Helpers

**Files:**
- Modify: `script.js`

- [ ] Extend `STORAGE_KEYS`:

```js
sets: "kneeRehabSetRowState"
```

- [ ] Add this configuration after `timerState`:

```js
const exerciseSetTrackers = [
  {
    id: "wall",
    label: "Wall Sit",
    totalSets: 2,
    sets: [
      { id: "wall-1", target: "30 sec hold" },
      { id: "wall-2", target: "30 sec hold" }
    ]
  },
  {
    id: "slr",
    label: "Straight Leg Raise",
    totalSets: 3,
    sets: [
      { id: "slr-1", target: "15 reps" },
      { id: "slr-2", target: "15 reps" },
      { id: "slr-3", target: "15 reps" }
    ]
  }
];

let setRowIntervalId = null;

const setRowState = {
  "wall-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false },
  "wall-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false },
  "slr-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false },
  "slr-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false },
  "slr-3": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false }
};
```

- [ ] Add helpers after `getCurrentElapsedMs`:

```js
const getAllSetRows = () => exerciseSetTrackers.flatMap((tracker) => tracker.sets);

const getSetRowState = (setId) => setRowState[setId];

const getCurrentSetRowElapsedMs = (setId) => {
  const state = getSetRowState(setId);
  if (!state) return 0;
  if (!state.isRunning || !state.startedAt) return normalizeElapsedMs(state.elapsedMs);
  return normalizeElapsedMs(state.elapsedMs + (Date.now() - state.startedAt));
};

const getCompletedSetCount = (tracker) => tracker.sets
  .filter((set) => getSetRowState(set.id)?.isDone)
  .length;
```

- [ ] Run `node --check script.js`.

Expected: no output and exit code `0`.

### Task 4: Persist and Restore Set Rows

**Files:**
- Modify: `script.js`

- [ ] Add these functions after `restoreTimer`:

```js
const readStoredSetRows = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.sets);
    if (storedValue === null) return {};

    const storedRows = JSON.parse(storedValue);
    if (!storedRows || typeof storedRows !== "object" || Array.isArray(storedRows)) {
      localStorage.removeItem(STORAGE_KEYS.sets);
      return {};
    }

    return storedRows;
  } catch (error) {
    console.warn("Could not parse stored set row state. Resetting set rows.", error);
    localStorage.removeItem(STORAGE_KEYS.sets);
    return {};
  }
};

const saveSetRows = () => {
  const state = {};

  getAllSetRows().forEach((set) => {
    const rowState = getSetRowState(set.id);
    const startedAt = Number(rowState.startedAt);

    state[set.id] = {
      elapsedMs: normalizeElapsedMs(rowState.elapsedMs),
      startedAt: Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null,
      isRunning: Boolean(rowState.isRunning),
      isDone: rowState.isDone === true
    };
  });

  localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(state));
};

const restoreSetRows = () => {
  const storedRows = readStoredSetRows();

  getAllSetRows().forEach((set) => {
    const storedState = storedRows[set.id];
    const startedAt = Number(storedState?.startedAt);

    setRowState[set.id].elapsedMs = normalizeElapsedMs(storedState?.elapsedMs);
    setRowState[set.id].startedAt = Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
    setRowState[set.id].isRunning = storedState?.isRunning === true && setRowState[set.id].startedAt !== null;
    setRowState[set.id].isDone = storedState?.isDone === true;
  });
};
```

- [ ] Run `node --check script.js`.

Expected: no output and exit code `0`.

### Task 5: Render Rows and Wire Controls

**Files:**
- Modify: `script.js`

- [ ] Add these functions before `setupNotes`:

```js
const clearSetRowInterval = () => {
  if (setRowIntervalId === null) return;
  window.clearInterval(setRowIntervalId);
  setRowIntervalId = null;
};

const hasRunningSetRow = () => getAllSetRows().some((set) => getSetRowState(set.id).isRunning);

const renderSetRow = (set) => {
  const rowState = getSetRowState(set.id);
  const elapsedMs = getCurrentSetRowElapsedMs(set.id);
  const row = document.querySelector(`[data-set-row="${set.id}"]`);
  const timer = document.getElementById(`${set.id}-timer`);
  const toggle = document.getElementById(`${set.id}-toggle`);
  const done = document.getElementById(`${set.id}-done`);

  if (row) row.classList.toggle("completed", rowState.isDone);
  if (timer) timer.textContent = formatTimer(elapsedMs);
  if (toggle) {
    toggle.textContent = rowState.isRunning ? "❚❚" : "▶";
    toggle.setAttribute("aria-label", `${rowState.isRunning ? "Pause" : "Start"} ${set.id.replace("-", " set ")}`);
  }
  if (done) done.checked = rowState.isDone;
};

const renderExerciseSetTracker = (tracker) => {
  document.getElementById(`${tracker.id}-set-count`).textContent = String(getCompletedSetCount(tracker));
  document.getElementById(`${tracker.id}-set-total`).textContent = String(tracker.totalSets);
  tracker.sets.forEach(renderSetRow);
};

const renderSetRows = () => {
  exerciseSetTrackers.forEach(renderExerciseSetTracker);
};

const ensureSetRowInterval = () => {
  clearSetRowInterval();
  if (hasRunningSetRow()) {
    setRowIntervalId = window.setInterval(renderSetRows, 1000);
  }
};

const pauseSetRow = (setId) => {
  const rowState = getSetRowState(setId);
  if (!rowState?.isRunning) return;

  rowState.elapsedMs = getCurrentSetRowElapsedMs(setId);
  rowState.startedAt = null;
  rowState.isRunning = false;
};

const pauseOtherSetRows = (activeSetId) => {
  getAllSetRows().forEach((set) => {
    if (set.id !== activeSetId) pauseSetRow(set.id);
  });
};

const toggleSetRowTimer = (setId) => {
  const rowState = getSetRowState(setId);
  if (!rowState) return;

  if (rowState.isRunning) {
    pauseSetRow(setId);
  } else {
    pauseOtherSetRows(setId);
    rowState.elapsedMs = normalizeElapsedMs(rowState.elapsedMs);
    rowState.startedAt = Date.now();
    rowState.isRunning = true;
  }

  saveSetRows();
  renderSetRows();
  ensureSetRowInterval();
  saveLastUpdated();
};

const setRowDone = (setId, isDone) => {
  const rowState = getSetRowState(setId);
  if (!rowState) return;

  rowState.isDone = isDone;
  if (isDone) {
    pauseSetRow(setId);
  }

  saveSetRows();
  renderSetRows();
  ensureSetRowInterval();
  saveLastUpdated();
};

const resetExerciseSetRows = (trackerId) => {
  const tracker = exerciseSetTrackers.find((item) => item.id === trackerId);
  if (!tracker) return;

  const shouldReset = window.confirm(`Reset ${tracker.label} set rows? Your checklist, notes, and session timer will stay saved.`);
  if (!shouldReset) return;

  tracker.sets.forEach((set) => {
    setRowState[set.id] = {
      elapsedMs: 0,
      startedAt: null,
      isRunning: false,
      isDone: false
    };
  });

  saveSetRows();
  renderSetRows();
  ensureSetRowInterval();
  saveLastUpdated();
};

const setupSetRows = () => {
  restoreSetRows();
  renderSetRows();
  ensureSetRowInterval();

  getAllSetRows().forEach((set) => {
    document.getElementById(`${set.id}-toggle`)?.addEventListener("click", () => toggleSetRowTimer(set.id));
    document.getElementById(`${set.id}-done`)?.addEventListener("change", (event) => setRowDone(set.id, event.target.checked));
  });

  exerciseSetTrackers.forEach((tracker) => {
    document.getElementById(`${tracker.id}-set-reset`)?.addEventListener("click", () => resetExerciseSetRows(tracker.id));
  });
};
```

- [ ] Add `setupSetRows();` inside `DOMContentLoaded`, after `setupTimer();`:

```js
document.addEventListener("DOMContentLoaded", () => {
  setupSessionMeta();
  restoreChecklist();
  setupChecklistListeners();
  setupNotes();
  setupReset();
  setupTimer();
  setupSetRows();
});
```

- [ ] Run `node --check script.js`.

Expected: no output and exit code `0`.

### Task 6: Manual Browser Verification

**Files:**
- No source edits unless verification finds a bug.

- [ ] Run `python3 -m http.server 8000`.
- [ ] Open `http://localhost:8000/`.
- [ ] Verify Wall Sit shows two numbered rows and `0 / 2 sets`.
- [ ] Verify SLR shows three numbered rows and `0 / 3 sets`.
- [ ] Click Wall Sit row 1 play; wait 2 seconds; verify only Wall Sit row 1 timer increments.
- [ ] Click Wall Sit row 1 pause; wait 2 seconds; verify it stops.
- [ ] Click Wall Sit row 2 play; verify Wall Sit row 1 stays paused and row 2 increments.
- [ ] Check Wall Sit row 2 `Done`; verify Wall Sit count becomes `1 / 2 sets` and row 2 timer stops.
- [ ] Refresh; verify completed rows and elapsed row timers persist.
- [ ] Start SLR row 1 while Wall Sit row 2 is running; verify Wall Sit row 2 pauses and SLR row 1 runs.
- [ ] Mark all SLR rows done; verify SLR count becomes `3 / 3 sets`.
- [ ] Reset SLR set rows; accept confirmation; verify SLR returns to `0 / 3 sets` and row timers return to `00:00`.
- [ ] Verify `Reset Sets` does not clear checklist, notes, or the whole-session timer.
- [ ] Verify `Reset Checklist` does not clear set rows.
- [ ] Check the browser console and page errors.
- [ ] At `375px` width, verify there is no horizontal scrolling.

### Task 7: Optional README Update

**Files:**
- Modify: `README.md`

- [ ] Add this bullet under `## Notes`:

```markdown
- Wall Sit and Straight Leg Raise include workout-style set rows with per-set timers saved locally in the browser.
```

## Commit Plan

This checkout may not expose a readable Git repository. If Git is available, commit with:

```bash
git add index.html styles.css script.js README.md
git commit -m "Add exercise set timers"
```

If Git is not available, skip the commit and report the changed files.

## Self-Review

- Spec coverage: Example-style set rows, per-row timers, completed set counts, persistence, reset isolation, one active set row at a time, responsive layout, and manual verification are covered.
- Placeholder scan: No `TBD`, `TODO`, or undefined function references remain.
- Type consistency: Exercise IDs are `wall` and `slr`; row IDs are `wall-1`, `wall-2`, `slr-1`, `slr-2`, and `slr-3`; storage key is `sets`; state fields are `elapsedMs`, `startedAt`, `isRunning`, and `isDone`.
