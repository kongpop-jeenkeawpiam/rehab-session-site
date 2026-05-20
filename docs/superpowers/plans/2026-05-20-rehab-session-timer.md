# Rehab Session Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent rehab session timer so the user can start, pause, resume, and reset elapsed session time while completing the checklist.

**Architecture:** Keep the app dependency-free and client-only. Add timer markup to the existing hero summary area, style it with the current card/button system, and extend `script.js` with a small timer state machine backed by `localStorage`.

**Tech Stack:** HTML, CSS, vanilla JavaScript, `localStorage`, `setInterval`, `Date.now()`.

---

## Files

- Modify `index.html`: add timer display and controls near the existing session summary/progress area.
- Modify `styles.css`: add responsive timer layout, time display, and button states.
- Modify `script.js`: add timer state, persistence, rendering, event listeners, and reset behavior.
- Optional modify `README.md`: document the timer behavior after implementation.

## Assumptions

- The timer tracks total elapsed rehab-session time, not individual wall-sit or SLR countdowns.
- Refreshing the page should preserve elapsed time and whether the timer was running.
- `Reset Checklist` should not reset the timer unless the implementation adds a separate explicit `Reset Timer` button.
- `Clear Notes` should not affect the timer.

## Tasks

### Task 1: Add Timer UI

- [ ] In `index.html`, add a third item inside `.session-panel`:

```html
<div class="timer-panel" aria-label="Session timer">
  <span class="meta-label">Session timer</span>
  <strong id="session-timer" aria-live="polite">00:00</strong>
  <div class="timer-actions">
    <button type="button" id="timer-toggle" class="button primary-button">Start</button>
    <button type="button" id="timer-reset" class="button secondary-button">Reset</button>
  </div>
</div>
```

- [ ] Keep it inside the hero so the timer is visible before the exercise cards.
- [ ] Manually open the page and confirm the new timer card appears without shifting the progress card awkwardly.

### Task 2: Style Timer Controls

- [ ] In `styles.css`, add `.timer-panel`, `#session-timer`, `.timer-actions`, and `.primary-button` rules.
- [ ] Reuse existing colors and spacing variables; do not introduce a new visual system.
- [ ] Make controls wrap cleanly on mobile:

```css
.timer-panel {
  display: grid;
  gap: 0.75rem;
}

#session-timer {
  font-variant-numeric: tabular-nums;
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  line-height: 1;
}

.timer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.primary-button {
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
}
```

- [ ] Check desktop and mobile widths for no horizontal scrolling.

### Task 3: Add Timer State and Formatting

- [ ] In `script.js`, extend `STORAGE_KEYS`:

```js
timer: "kneeRehabTimerState"
```

- [ ] Add a timer state object:

```js
let timerIntervalId = null;

const timerState = {
  elapsedMs: 0,
  startedAt: null,
  isRunning: false
};
```

- [ ] Add formatting helpers:

```js
const formatTimer = (totalMs) => {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const getCurrentElapsedMs = () => {
  if (!timerState.isRunning || !timerState.startedAt) return timerState.elapsedMs;
  return timerState.elapsedMs + (Date.now() - timerState.startedAt);
};
```

- [ ] Confirm `formatTimer(0)` renders `00:00`, and sessions over one hour render as `01:00:00`.

### Task 4: Persist and Restore Timer

- [ ] Add `readStoredTimer`, `saveTimer`, and `restoreTimer` functions.
- [ ] Store only serializable values:

```js
const readStoredTimer = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.timer) || "{}");
  } catch (error) {
    console.warn("Could not parse stored timer state. Resetting timer.", error);
    localStorage.removeItem(STORAGE_KEYS.timer);
    return {};
  }
};

const saveTimer = () => {
  localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify({
    elapsedMs: timerState.elapsedMs,
    startedAt: timerState.startedAt,
    isRunning: timerState.isRunning
  }));
};

const restoreTimer = () => {
  const storedTimer = readStoredTimer();
  timerState.elapsedMs = Number(storedTimer.elapsedMs) || 0;
  timerState.startedAt = storedTimer.startedAt ? Number(storedTimer.startedAt) : null;
  timerState.isRunning = Boolean(storedTimer.isRunning);
};
```

- [ ] When restoring a running timer, keep it running by using the saved `startedAt` timestamp.

### Task 5: Render and Control Timer

- [ ] Add `renderTimer`, `startTimer`, `pauseTimer`, `toggleTimer`, and `resetTimer`.
- [ ] Use one interval while running and clear it when paused/reset:

```js
const renderTimer = () => {
  const timerDisplay = document.getElementById("session-timer");
  const timerToggle = document.getElementById("timer-toggle");

  timerDisplay.textContent = formatTimer(getCurrentElapsedMs());
  timerToggle.textContent = timerState.isRunning ? "Pause" : timerState.elapsedMs > 0 ? "Resume" : "Start";
};

const startTimer = () => {
  if (timerState.isRunning) return;
  timerState.startedAt = Date.now();
  timerState.isRunning = true;
  saveTimer();
  renderTimer();
  timerIntervalId = window.setInterval(renderTimer, 1000);
  saveLastUpdated();
};

const pauseTimer = () => {
  if (!timerState.isRunning) return;
  timerState.elapsedMs = getCurrentElapsedMs();
  timerState.startedAt = null;
  timerState.isRunning = false;
  window.clearInterval(timerIntervalId);
  timerIntervalId = null;
  saveTimer();
  renderTimer();
  saveLastUpdated();
};

const toggleTimer = () => {
  if (timerState.isRunning) {
    pauseTimer();
    return;
  }
  startTimer();
};

const resetTimer = () => {
  const shouldReset = window.confirm("Reset the session timer? Your checklist and notes will stay saved.");
  if (!shouldReset) return;

  window.clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerState.elapsedMs = 0;
  timerState.startedAt = null;
  timerState.isRunning = false;
  localStorage.removeItem(STORAGE_KEYS.timer);
  renderTimer();
  saveLastUpdated();
};
```

- [ ] Add `setupTimer`:

```js
const setupTimer = () => {
  restoreTimer();
  renderTimer();

  if (timerState.isRunning) {
    timerIntervalId = window.setInterval(renderTimer, 1000);
  }

  document.getElementById("timer-toggle").addEventListener("click", toggleTimer);
  document.getElementById("timer-reset").addEventListener("click", resetTimer);
};
```

- [ ] Call `setupTimer()` inside `DOMContentLoaded`.

### Task 6: Manual Verification

- [ ] Run:

```bash
python3 -m http.server 8000
```

- [ ] Open `http://localhost:8000/`.
- [ ] Verify timer starts at `00:00`.
- [ ] Click `Start`; wait 3 seconds; verify timer increments.
- [ ] Click `Pause`; wait 3 seconds; verify timer stays unchanged.
- [ ] Click `Resume`; verify it continues from the paused value.
- [ ] Refresh while paused; verify elapsed time persists.
- [ ] Start timer, refresh while running, and verify it continues from the real elapsed time.
- [ ] Click `Reset`; verify only timer state clears.
- [ ] Confirm checklist progress, notes, and last-updated behavior still work.
- [ ] Check mobile width around 375px and confirm no horizontal scroll.

### Task 7: Optional Documentation

- [ ] If desired, update `README.md` with one sentence:

```markdown
The tracker includes a persistent session timer with start, pause, resume, and reset controls stored locally in the browser.
```

## Commit Plan

- [ ] Commit UI and script changes together:

```bash
git add index.html styles.css script.js README.md
git commit -m "Add rehab session timer"
```

## Self-Review

- Spec coverage: Timer UI, controls, persistence, reset isolation, and manual testing are covered.
- Placeholder scan: No `TBD`, `TODO`, or undefined task references remain.
- Type consistency: Timer state fields are consistently `elapsedMs`, `startedAt`, and `isRunning`.
