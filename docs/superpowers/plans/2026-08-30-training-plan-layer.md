# Training Plan Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Set 1/Set 2 selector whose Basketball-Flex sessions resolve from the selected date, allow basketball on any day, and preserve all original exercises and legacy progress.

**Architecture:** Add a pure protocol engine and a pure session-record migration helper as browser globals loaded before `script.js`. Keep `script.js` as the UI orchestrator, but make progress, timers, history, mobile navigation, and sync consume the resolved active session instead of fixed global lists.

**Tech Stack:** Dependency-free HTML/CSS/JavaScript, Node.js built-in test/assert modules, browser `localStorage`, optional Supabase JavaScript v2.

**Spec:** `docs/superpowers/specs/2026-08-30-training-plan-layer-design.md`

## Global Constraints

- Preserve the eight Set 1 exercises, their checklist/set IDs, timers, history, and legacy storage keys.
- User labels are `Set 1 — Original Rehab` and `Set 2 — Basketball-Flex`; internal IDs are `original-rehab` and `basketball-flex`.
- Set 2 resolves from the selected calendar date and allows basketball on every day.
- A `follow-plan` day after basketball resolves to `Full Rest + Quad Set`.
- Consecutive basketball is allowed with an informational warning.
- Checklist/timer state is isolated by date and plan; notes and daily safety logs remain shared by date.
- Records without plan metadata resolve as Set 1 and are never deleted.
- Keep the app static, dependency-free, bilingual, accessible, local-first, and usable at 320px without horizontal scrolling.
- Do not add diagnosis, medical clearance, or progression rules beyond the supplied plan.
- Use 2-space indentation and red-green-refactor for every behavior change.

## File Map

- Create `training-plans.js`: plan constants, weekday prescriptions, resolver, date helpers, and load count.
- Create `training-plan-state.js`: validation, migration, and immutable plan snapshot helpers.
- Create five focused `tests/training-plan-*.test.mjs` files.
- Modify `index.html`, `styles.css`, and `script.js` for controls, cards, rendering, state, history, mobile, and localization.
- Modify `supabase-schema.sql`, `tests/supabase-sync.test.mjs`, `docs/api.md`, and `README.md` for sync compatibility.
- Update `task-checklist.md` with final verification evidence.

---

### Task 1: Pure Basketball-Flex protocol engine

**Files:**
- Create: `training-plans.js`
- Create: `tests/training-plan-engine.test.mjs`
- Modify: `index.html:913-914`

**Interfaces:**
- Consumes: `YYYY-MM-DD` dates and `follow-plan | basketball | recovery | skip`.
- Produces `globalThis.KneeRehabPlans`:
  - `PLAN_IDS`, `ACTIVITY_TYPES`
  - `normalizePlanId(value)`
  - `normalizeActivityType(value)`
  - `getPreviousDateKey(dateKey)`
  - `resolveSession({ dateKey, planId, activityType, previousDayActivity })`
  - `countBasketballDays(records, dateKey, windowDays)`
- Resolved shape: `{ planId, activityType, protocolId, titleKey, reasonKey, warningKey, items }`.
- Item shape: `{ id, kind, required, exerciseId?, setIds?, checkIds?, optionalSetIds?, reps?, tempo?, angle? }`.

- [ ] **Step 1: Write the failing engine tests**

Create a VM-loaded test:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../training-plans.js", import.meta.url), "utf8");
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const plans = context.globalThis.KneeRehabPlans;

test("Wednesday resolves Strength B", () => {
  const session = plans.resolveSession({
    dateKey: "2026-09-02",
    planId: "basketball-flex",
    activityType: "follow-plan",
    previousDayActivity: "follow-plan"
  });
  assert.equal(session.protocolId, "strength-b");
  assert.deepEqual(
    Array.from(session.items, (item) => item.id),
    ["mini-single-leg-squat", "tibialis-raise", "quad-set"]
  );
  assert.deepEqual(Array.from(session.items[1].optionalSetIds), ["tibialis-raise-3"]);
});

test("weekday basketball overrides and next day recovers", () => {
  const game = plans.resolveSession({
    dateKey: "2026-09-01",
    planId: "basketball-flex",
    activityType: "basketball",
    previousDayActivity: "follow-plan"
  });
  const next = plans.resolveSession({
    dateKey: "2026-09-02",
    planId: "basketball-flex",
    activityType: "follow-plan",
    previousDayActivity: "basketball"
  });
  assert.equal(game.protocolId, "game-day");
  assert.equal(next.protocolId, "full-rest");
});

test("consecutive basketball is retained with a warning", () => {
  const session = plans.resolveSession({
    dateKey: "2026-09-02",
    planId: "basketball-flex",
    activityType: "basketball",
    previousDayActivity: "basketball"
  });
  assert.equal(session.protocolId, "game-day");
  assert.equal(session.warningKey, "plan.warning.consecutiveBasketball");
});
```

Also test:

- Unknown/missing plan → `original-rehab`.
- Unknown activity → `follow-plan`.
- Monday–Sunday → `strength-a`, `active-recovery`, `strength-b`, `active-recovery`, `pre-game-prep`, `weekend-recovery`, `weekend-recovery`.
- Rolling seven days count basketball inclusively.
- Returned objects do not mutate engine constants.

- [ ] **Step 2: Run RED**

Run `node --test tests/training-plan-engine.test.mjs`.

Expected: FAIL with `ENOENT` for `training-plans.js`.

- [ ] **Step 3: Implement the engine**

Use a browser-safe IIFE. Exact Set 2 prescriptions:

| Protocol | Ordered items |
| --- | --- |
| `strength-a` | Clam 1×12; Mini Single Leg Squat 2×5, `3-1-1`, 30°–45°; Bridge 2×12; Calf 2×15; Quad Set 3×10 |
| Tuesday `active-recovery` | Quad Set 3×10; `recovery-stretches` checks `knee-to-chest-done`, `quad-stretch-done` |
| `strength-b` | Mini Single Leg Squat 2×5; Tibialis 2 required + 1 optional ×15; Quad Set 3×10 |
| Thursday `active-recovery` | Quad Set 3×10; `hip-quad-mobility` check `hip-quad-mobility-done` |
| `pre-game-prep` | Quad Set 3×10; checks `joint-mobilization-done`, `sleep-recovery-done` |
| `weekend-recovery` | Quad Set 3×10; check `recovery-rest-done` |
| `game-day` | checks `game-firm-insole`, `game-limit-checked`, `game-ice-complete` |
| `full-rest` | Quad Set 3×10; check `full-rest-done` |
| `skip-training` | no items |

Core precedence:

```js
const resolveProtocolId = ({ weekday, activityType, previousDayActivity }) => {
  if (activityType === ACTIVITY_TYPES.basketball) return "game-day";
  if (activityType === ACTIVITY_TYPES.recovery) return "weekend-recovery";
  if (activityType === ACTIVITY_TYPES.skip) return "skip-training";
  if (previousDayActivity === ACTIVITY_TYPES.basketball) return "full-rest";
  return BASE_PROTOCOL_BY_WEEKDAY[weekday];
};
```

Parse local dates at noon to prevent timezone shifts. Clone all returned arrays/objects. Freeze the exported API.

- [ ] **Step 4: Load before the app**

```html
<script src="training-plans.js" defer></script>
<script src="script.js" defer></script>
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test tests/training-plan-engine.test.mjs
node --test tests/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add training-plans.js tests/training-plan-engine.test.mjs index.html
git commit -m "Add basketball flex protocol engine"
```

### Task 2: Plan-scoped state and legacy migration

**Files:**
- Create: `training-plan-state.js`
- Create: `tests/training-plan-state.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces `globalThis.KneeRehabPlanState`:
  - `isPlainObject(value)`
  - `normalizePlanSnapshot(value)`
  - `migrateSessionRecord(record, dateKey)`
  - `getPlanSnapshot(record, planId)`
  - `setPlanSnapshot(record, planId, snapshot)`
- Normal record: `planId`, `activityType`, `resolvedProtocolId`, `planStates`.
- Each plan state: `checklist`, `setRows`, `exercises`.

- [ ] **Step 1: Write failing state tests**

```js
test("legacy progress migrates without deletion", () => {
  const legacy = {
    checklist: { "quad-set-setup": true },
    setRows: { "quad-set-1": { isDone: true } },
    exercises: { "quad-set": { completedSets: 1 } },
    notes: "shared"
  };
  const record = state.migrateSessionRecord(legacy, "2026-09-01");
  assert.equal(record.planId, "original-rehab");
  assert.deepEqual(record.planStates["original-rehab"].checklist, legacy.checklist);
  assert.deepEqual(record.checklist, legacy.checklist);
  assert.equal(record.notes, "shared");
});

test("plan snapshots stay isolated", () => {
  let record = state.migrateSessionRecord({}, "2026-09-01");
  record = state.setPlanSnapshot(record, "original-rehab", {
    checklist: { a: true }, setRows: {}, exercises: {}
  });
  record = state.setPlanSnapshot(record, "basketball-flex", {
    checklist: { a: false }, setRows: { b: { isDone: true } }, exercises: {}
  });
  assert.equal(state.getPlanSnapshot(record, "original-rehab").checklist.a, true);
  assert.equal(state.getPlanSnapshot(record, "basketball-flex").checklist.a, false);
});
```

Also test invalid nested values, unknown plan/activity fallback, input non-mutation, and preservation of `notes`/`monitoring`.

- [ ] **Step 2: Run RED**

Run `node --test tests/training-plan-state.test.mjs`.

Expected: FAIL with `ENOENT`.

- [ ] **Step 3: Implement immutable helpers**

```js
const plans = globalThis.KneeRehabPlans;

const migrateSessionRecord = (record, dateKey) => {
  const source = isPlainObject(record) ? record : {};
  const planId = plans.normalizePlanId(source.planId);
  const legacy = normalizePlanSnapshot(source);
  const planStates = normalizePlanStates(source.planStates);
  if (!planStates["original-rehab"]) planStates["original-rehab"] = legacy;
  const active = planStates[planId] || normalizePlanSnapshot({});
  return {
    ...source,
    dateKey,
    planId,
    activityType: plans.normalizeActivityType(source.activityType),
    resolvedProtocolId: typeof source.resolvedProtocolId === "string"
      ? source.resolvedProtocolId
      : "original-rehab",
    planStates,
    checklist: active.checklist,
    setRows: active.setRows,
    exercises: active.exercises
  };
};
```

`setPlanSnapshot` must return new outer/nested objects and mirror the chosen snapshot into top-level legacy fields only when its plan ID equals `record.planId`. Preserve unknown top-level fields.

- [ ] **Step 4: Load helpers in order**

```html
<script src="training-plans.js" defer></script>
<script src="training-plan-state.js" defer></script>
<script src="script.js" defer></script>
```

- [ ] **Step 5: Verify and commit**

```bash
node --test tests/training-plan-state.test.mjs
node --test tests/*.test.mjs
git add training-plan-state.js tests/training-plan-state.test.mjs index.html
git commit -m "Add plan scoped session migration"
```

### Task 3: Plan controls, localization, and styling

**Files:**
- Create: `tests/training-plan-ui.test.mjs`
- Modify: `index.html:85`
- Modify: `styles.css`
- Modify: `script.js:38-52,119-663,1010-1055,2417-2439,3457-3472`

**Interfaces:**
- DOM IDs: `training-plan-panel`, `training-plan-select`, `activity-control`, `activity-type-select`, `resolved-protocol-label`, `protocol-reason`, `load-warning`.
- Storage: `kneeRehabTrainingPlanPreference`.
- Script functions: `getActivePlanId()`, `getPreviousDayActivity(dateKey)`, `getResolvedActiveSession()`, `renderTrainingPlanControls()`, `renderActiveSession()`, `selectTrainingPlan(planId)`, `selectActivityType(activityType)`, `setupTrainingPlanControls()`.

- [ ] **Step 1: Write failing UI contract tests**

Assert:

- Both selects have visible connected labels and exact option values.
- `load-warning` is a polite live region.
- English and Thai include `plan.trainingSet`, `plan.original`, `plan.basketballFlex`, `plan.activity`, four activity labels, eight protocol labels, previous-basketball reason, consecutive warning, and weekly-load warning.
- CSS includes `.training-plan-panel`, `.plan-control-grid`, `.load-warning`, 44px controls, focus-visible rules, and a one-column rule below 520px.
- `setupTrainingPlanControls()` runs after `setupCalendar()` and before `applySelectedDateSession()`.

- [ ] **Step 2: Run RED**

Run `node --test tests/training-plan-ui.test.mjs`.

Expected: FAIL because the panel is absent.

- [ ] **Step 3: Add semantic HTML**

Insert above Progress:

```html
<section id="training-plan-panel" class="training-plan-panel" aria-labelledby="training-plan-heading">
  <div>
    <span class="meta-label" data-i18n="plan.meta">Training plan</span>
    <h2 id="training-plan-heading" data-i18n="plan.heading">Choose today’s training set</h2>
  </div>
  <div class="plan-control-grid">
    <label for="training-plan-select">
      <span data-i18n="plan.trainingSet">Training Set</span>
    </label>
    <select id="training-plan-select">
      <option value="original-rehab">Set 1 — Original Rehab</option>
      <option value="basketball-flex">Set 2 — Basketball-Flex</option>
    </select>
    <div id="activity-control" hidden>
      <label for="activity-type-select">
        <span data-i18n="plan.activity">Today’s Activity</span>
      </label>
      <select id="activity-type-select">
        <option value="follow-plan">Follow plan</option>
        <option value="basketball">Basketball today</option>
        <option value="recovery">Recovery / Rest</option>
        <option value="skip">Skip training</option>
      </select>
    </div>
  </div>
  <p><strong id="resolved-protocol-label"></strong></p>
  <p id="protocol-reason" hidden></p>
  <p id="load-warning" class="load-warning" role="status" aria-live="polite" hidden></p>
</section>
```

Use existing blue/green variables and card surfaces.

- [ ] **Step 4: Implement date-aware control state**

```js
const planUiState = {
  planId: KneeRehabPlans.PLAN_IDS.original,
  activityType: KneeRehabPlans.ACTIVITY_TYPES.followPlan,
  resolvedSession: null
};

const getPreviousDayActivity = (dateKey) => {
  const previousKey = KneeRehabPlans.getPreviousDateKey(dateKey);
  return KneeRehabPlans.normalizeActivityType(
    calendarState.sessionHistory[previousKey]?.activityType
  );
};

const getResolvedActiveSession = () => KneeRehabPlans.resolveSession({
  dateKey: getActiveDateKey(),
  planId: planUiState.planId,
  activityType: planUiState.activityType,
  previousDayActivity: getPreviousDayActivity(getActiveDateKey())
});
```

Before a plan switch, save the current snapshot. For non-future dates, store the chosen plan/activity in the dated record and queue sync. Restore the target snapshot after switching. Use the record plan when available, otherwise the stored preference. Disable activity edits on future dates.

- [ ] **Step 5: Render localized protocol state**

Task 3 introduces the first orchestration implementation so controls never call a function defined only by a later task:

```js
const renderActiveSession = () => {
  planUiState.resolvedSession = getResolvedActiveSession();
  renderTrainingPlanControls();
  updateProgress();
  renderSessionHistory();
  renderMobileSessionMode();
};
```

`renderTrainingPlanControls` must:

- Set both select values.
- Hide activity control for Set 1.
- Translate `resolvedSession.titleKey`.
- Show `reasonKey` and `warningKey` only when present.
- Preserve focus after changes.
- Call the shared `renderActiveSession()` orchestration path rather than duplicating renders.

- [ ] **Step 6: Verify and commit**

```bash
node --test tests/training-plan-ui.test.mjs
node --test tests/selected-date-session.test.mjs tests/bilingual-i18n.test.mjs
node --test tests/*.test.mjs
git add index.html styles.css script.js tests/training-plan-ui.test.mjs
git commit -m "Add training plan selection controls"
```

Expected: all tests PASS.

### Task 4: Active exercises, dosage, progress, timers, and resets

**Files:**
- Create: `tests/training-plan-session.test.mjs`
- Modify: `index.html:259-794`
- Modify: `styles.css:757-900,1243-1266`
- Modify: `script.js:1-35,91-100,1075-1125,1304-1598,1696-1735,2767-3244`

**Interfaces:**
- Produces `EXERCISE_REGISTRY`, `getActiveSessionItems()`, `getActiveExerciseDefinitions()`, `getActiveCheckIds()`, `getActiveSetIds()`, `getRequiredActiveSetIds()`, `getActiveMobileSteps()`, `applyActiveSessionVisibility()`, and `renderActiveSession()`.
- New IDs: `calf-raise`, `tibialis-raise`, `flex-session-actions-card`, `flex-session-actions-list`.

- [ ] **Step 1: Write failing active-session tests**

Assert Strength B returns these set IDs:

```js
[
  "mini-single-leg-squat-1",
  "mini-single-leg-squat-2",
  "tibialis-raise-1",
  "tibialis-raise-2",
  "tibialis-raise-3",
  "quad-set-1",
  "quad-set-2",
  "quad-set-3"
]
```

Assert Tibialis sets 1–2 complete the required portion when set 3 is false. Assert:

- Calf and Tibialis cards contain five set rows and six checklist IDs.
- The action host exists.
- `getCheckboxes` derives from active IDs.
- Resetting Set 2 leaves the Set 1 snapshot unchanged.
- Existing `three-phase-protocol.test.mjs` still identifies exactly eight Set 1 exercises.

- [ ] **Step 2: Run RED**

Run `node --test tests/training-plan-session.test.mjs`.

Expected: FAIL because new cards/helpers are absent.

- [ ] **Step 3: Add Set 2 cards**

Calf checklist IDs:

```js
["calf-raise-setup", "calf-raise-tempo", "calf-raise-safety"]
```

Calf sets: `calf-raise-1`, `calf-raise-2`.

Tibialis checklist IDs:

```js
["tibialis-raise-setup", "tibialis-raise-control", "tibialis-raise-safety"]
```

Tibialis sets: `tibialis-raise-1`, `tibialis-raise-2`, `tibialis-raise-3`; mark set 3 Optional visibly and accessibly.

The dynamic action card supports exactly:

```js
[
  "knee-to-chest-done",
  "quad-stretch-done",
  "hip-quad-mobility-done",
  "joint-mobilization-done",
  "sleep-recovery-done",
  "recovery-rest-done",
  "game-firm-insole",
  "game-limit-checked",
  "game-ice-complete",
  "full-rest-done"
]
```

Add English and Thai labels/instructions for every action ID. Game Day copy must state the supplied firm-insole rule, maximum 2–3 games, and immediate 10–15 minute ice guidance. Full Rest copy must not imply medical clearance. Keep the existing pain threshold and next-morning monitoring visible for Set 2.

- [ ] **Step 4: Make dosage plan-aware**

Keep `REHAB_EXERCISES` unchanged. Add registry entries and base timing:

```js
"calf-raise": {
  totalReps: 15, workDurationSec: 3, restDurationSec: 3,
  workCue: "Lift", restCue: "Relax", activeTargetPrefix: "Rep"
},
"tibialis-raise": {
  totalReps: 15, workDurationSec: 2, restDurationSec: 2,
  workCue: "Lift", restCue: "Relax", activeTargetPrefix: "Rep"
}
```

Merge the active prescription’s `reps` into `getSetRowConfig(setId)`. When switching plans, save old set state first, restore the target snapshot, and initialize only missing active rows.

- [ ] **Step 5: Scope global queries**

`getActiveSessionItems()` adapts Set 1 before any consumer reads it:

```js
const getActiveSessionItems = () => getActivePlanId() === "original-rehab"
  ? REHAB_EXERCISES.map((exercise) => ({
    id: exercise.id, kind: "exercise", required: true,
    exerciseId: exercise.id, setIds: exercise.setIds, checkIds: exercise.checkIds
  }))
  : planUiState.resolvedSession?.items || [];
```

```js
const getCheckboxes = () => getActiveCheckIds()
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const getRequiredActiveSetIds = () => getActiveSessionItems()
  .flatMap((item) => (item.setIds || [])
    .filter((id) => !(item.optionalSetIds || []).includes(id)));
```

Update progress, set intervals, exercise summaries, Reset Checklist, Reset All Sets, and history snapshots to use active definitions. Completion eligibility requires at least one required active item complete plus the existing immediate monitoring rule; it must work for Game Day action-only sessions and remain disabled for Skip Training. Add focused tests for both cases.

Hidden cards use the native `hidden` attribute. Expand Task 3's `renderActiveSession()` so it runs visibility, action rendering, set rows, progress, controls, history, and mobile rendering once in that order.

- [ ] **Step 6: Verify and commit**

```bash
node --test tests/training-plan-session.test.mjs
node --test tests/reset-all-sets.test.mjs tests/three-phase-protocol.test.mjs
node --test tests/*.test.mjs
git add index.html styles.css script.js tests/training-plan-session.test.mjs
git commit -m "Render plan scoped rehab sessions"
```

### Task 5: History, next-day behavior, mobile steps, and warnings

**Files:**
- Create: `tests/training-plan-history-mobile.test.mjs`
- Modify: `script.js:1111-1288,1639-1804,2260-2451`
- Modify: `index.html:13-29,191-223,893-897`
- Modify: `styles.css:1105-1305`

**Interfaces:**
- Produces plan metadata in all session records, `renderPlanHistory(container, record)`, dynamic mobile steps, and rolling-load warnings.

- [ ] **Step 1: Write failing integration tests**

Test:

- Legacy today records return `planId: "original-rehab"`.
- Current records retain both `planStates`.
- Thursday after Wednesday basketball resolves `full-rest`.
- Explicit Thursday basketball remains `game-day` with warning.
- Strength B mobile steps are three exercises plus monitoring.
- Skip Training has zero exercise steps and disabled Previous/Next.
- History displays plan, protocol, activity before exercise details.
- Notes and monitoring survive plan switches.

- [ ] **Step 2: Run RED**

Run `node --test tests/training-plan-history-mobile.test.mjs`.

Expected: FAIL because history/mobile are not plan-aware.

- [ ] **Step 3: Normalize every record boundary**

Call `migrateSessionRecord` from:

```js
[
  "readStoredSessionHistory",
  "createLegacyTodayRecord",
  "createMinimalSessionHistoryRecord",
  "createHistoryRecordFromSupabaseRow",
  "getSessionRecordForDate"
]
```

Before returning a current record, save its active snapshot with `setPlanSnapshot`. Include `planId`, `activityType`, `resolvedProtocolId`, and `planStates`.

A changed basketball activity rerenders the active date/calendar. Do not write a synthetic activity into tomorrow; derive tomorrow’s recovery from yesterday’s record so explicit tomorrow choices remain intact.

- [ ] **Step 4: Make mobile session-driven**

Replace the fixed mobile step constant with `getActiveMobileSteps()`. Clamp the active index when the resolved session changes. Rebuild step buttons only when the ordered step IDs change, preserving horizontal scroll between timer ticks. For Skip Training, show the empty/completed state and disable both navigation buttons.

- [ ] **Step 5: Render history and warning metadata**

Call `renderPlanHistory(panel, record)` before exercise details. Show localized Set, protocol, and activity. Use:

```js
KneeRehabPlans.countBasketballDays(
  calendarState.sessionHistory,
  getActiveDateKey(),
  7
)
```

Show weekly-load warning when count > 1 and prioritize the engine’s consecutive warning. Never present either as clearance.

- [ ] **Step 6: Verify and commit**

```bash
node --test tests/training-plan-history-mobile.test.mjs
node --test tests/mobile-session-mode.test.mjs tests/selected-date-session.test.mjs tests/todays-summary.test.mjs
node --test tests/*.test.mjs
git add script.js index.html styles.css tests/training-plan-history-mobile.test.mjs
git commit -m "Integrate plan history and mobile sessions"
```

### Task 6: Supabase compatibility and documentation

**Files:**
- Modify: `supabase-schema.sql`
- Modify: `script.js:1860-2027`
- Modify: `tests/supabase-sync.test.mjs`
- Modify: `docs/api.md`
- Modify: `README.md`

**Interfaces:**
- New columns: `plan_id`, `activity_type`, `resolved_protocol_id`, `plan_states`.
- Existing checklist/set/exercise columns remain active-plan mirrors for older clients.

- [ ] **Step 1: Extend failing sync tests**

```js
assert.match(schema, /add column if not exists plan_id text not null default 'original-rehab'/i);
assert.match(schema, /add column if not exists activity_type text not null default 'follow-plan'/i);
assert.match(schema, /add column if not exists resolved_protocol_id text/i);
assert.match(schema, /add column if not exists plan_states jsonb not null default '\{\}'::jsonb/i);
```

Also assert row mapping both directions and missing cloud fields → Set 1.

- [ ] **Step 2: Run RED**

Run `node --test tests/supabase-sync.test.mjs`.

Expected: FAIL because `plan_id` is absent.

- [ ] **Step 3: Add idempotent SQL**

```sql
alter table public.rehab_sessions
  add column if not exists plan_id text not null default 'original-rehab',
  add column if not exists activity_type text not null default 'follow-plan',
  add column if not exists resolved_protocol_id text,
  add column if not exists plan_states jsonb not null default '{}'::jsonb;
```

Do not alter the unique key, RLS, or existing columns.

- [ ] **Step 4: Map rows both directions**

Add to `createSupabaseRow`:

```js
plan_id: record.planId,
activity_type: record.activityType,
resolved_protocol_id: record.resolvedProtocolId || null,
plan_states: record.planStates || {}
```

Map snake_case back to camelCase and pass through migration. Retain top-level progress mirrors.

- [ ] **Step 5: Update docs**

`docs/api.md` must document:

- Four columns/defaults.
- `kneeRehabTrainingPlanPreference`.
- Seven control DOM IDs.
- Nested `planStates` example.
- Active-plan top-level mirrors.
- Legacy fallback and local-first behavior.

`README.md` adds Set selection, date-aware Set 2, weekday basketball, next-day recovery, and retains the medical disclaimer.

- [ ] **Step 6: Verify and commit**

```bash
node --test tests/supabase-sync.test.mjs tests/training-plan-state.test.mjs
node --test tests/*.test.mjs
git diff --check
git add supabase-schema.sql script.js tests/supabase-sync.test.mjs docs/api.md README.md
git commit -m "Sync training plan session metadata"
```

Expected: all tests PASS and whitespace check is clean.

### Task 7: Full regression and browser verification

**Files:**
- Update: `task-checklist.md`
- Modify implementation/test files only for defects found during verification.

**Interfaces:**
- Produces a verified static site with documented evidence.

- [ ] **Step 1: Run all automated and syntax checks**

```bash
node --test tests/*.test.mjs
node --check training-plans.js
node --check training-plan-state.js
node --check script.js
git diff --check
```

Expected: all tests PASS; syntax and whitespace commands produce no errors.

- [ ] **Step 2: Serve and check resources**

Start:

```bash
python3 -m http.server 8000
```

From a second terminal:

```bash
curl -I http://localhost:8000/
curl -I http://localhost:8000/training-plans.js
curl -I http://localhost:8000/training-plan-state.js
```

Expected: `200 OK`.

- [ ] **Step 3: Verify Set 1 at desktop and 320px**

Load representative legacy checklist/set storage. Confirm:

- Set 1 default.
- All eight original exercises in original order.
- Checklist/timer persistence after refresh.
- Resets affect Set 1 only.
- No console errors or horizontal scrolling.

- [ ] **Step 4: Verify Set 2 Monday–Sunday**

Confirm every base protocol/prescription. Record weekday basketball, then confirm next-day Full Rest + Quad Set. Select basketball again and confirm the warning without blocking. Confirm Set 1 state returns when switched back, future dates cannot save, and Tibialis set 3 is optional.

- [ ] **Step 5: Verify localization, mobile, and sync modes**

Confirm English/Thai plan/activity/protocol/reason/warning/exercise/action copy. Navigate Strength A, Strength B, Recovery, Game Day, Full Rest, and Skip on mobile. Refresh and confirm dated state. Confirm Local Only with no config. If a configured test account exists, confirm both plan snapshots survive a Supabase round trip.

- [ ] **Step 6: Record evidence and fix only proven defects**

Add dated commands/results to `task-checklist.md`. For any defect, first add a focused failing regression test, observe RED, apply the minimum fix, and rerun the full suite.

- [ ] **Step 7: Commit verification**

```bash
git add task-checklist.md tests index.html styles.css script.js training-plans.js training-plan-state.js
git commit -m "Verify training plan selector workflow"
```

Expected: the commit contains verification evidence and only regression-backed fixes.
