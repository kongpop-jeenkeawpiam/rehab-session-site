const checklistItems = [
  "wall-setup",
  "wall-angle",
  "wall-foot-position",
  "wall-data-check",
  "wall-safety-check",
  "slr-setup",
  "slr-lock-twist",
  "slr-tempo-lift",
  "slr-tempo-hold",
  "slr-tempo-lower",
  "slr-data-check",
  "monitor-immediate",
  "monitor-next-morning",
  "monitor-walking"
];

const STORAGE_KEYS = {
  checklist: "kneeRehabChecklistState",
  notes: "kneeRehabNotes",
  lastUpdated: "kneeRehabLastUpdated",
  timer: "kneeRehabTimerState",
  sets: "kneeRehabSetRowState"
};

let timerIntervalId = null;

const timerState = {
  elapsedMs: 0,
  startedAt: null,
  isRunning: false
};

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

const formatDateTime = (value) => {
  if (!value) return "Not started yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not started yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const normalizeElapsedMs = (value) => {
  const elapsedMs = Number(value);
  return Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
};

const formatTimer = (totalMs) => {
  const totalSeconds = Math.floor(normalizeElapsedMs(totalMs) / 1000);
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
  if (!timerState.isRunning || !timerState.startedAt) return normalizeElapsedMs(timerState.elapsedMs);
  return normalizeElapsedMs(timerState.elapsedMs + (Date.now() - timerState.startedAt));
};

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

const readStoredTimer = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.timer);
    if (storedValue === null) return {};

    const storedTimer = JSON.parse(storedValue);
    if (!storedTimer || typeof storedTimer !== "object" || Array.isArray(storedTimer)) {
      localStorage.removeItem(STORAGE_KEYS.timer);
      return {};
    }
    return storedTimer;
  } catch (error) {
    console.warn("Could not parse stored timer state. Resetting timer.", error);
    localStorage.removeItem(STORAGE_KEYS.timer);
    return {};
  }
};

const saveTimer = () => {
  const startedAt = Number(timerState.startedAt);

  localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify({
    elapsedMs: normalizeElapsedMs(timerState.elapsedMs),
    startedAt: Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null,
    isRunning: Boolean(timerState.isRunning)
  }));
};

const restoreTimer = () => {
  const storedTimer = readStoredTimer();
  const startedAt = Number(storedTimer.startedAt);

  timerState.elapsedMs = normalizeElapsedMs(storedTimer.elapsedMs);
  timerState.startedAt = Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
  timerState.isRunning = storedTimer.isRunning === true && timerState.startedAt !== null;
};

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

const clearTimerInterval = () => {
  if (timerIntervalId === null) return;
  window.clearInterval(timerIntervalId);
  timerIntervalId = null;
};

const renderTimer = () => {
  const timerDisplay = document.getElementById("session-timer");
  const timerToggle = document.getElementById("timer-toggle");
  const currentElapsedMs = getCurrentElapsedMs();

  if (timerDisplay) {
    timerDisplay.textContent = formatTimer(currentElapsedMs);
  }

  if (timerToggle) {
    timerToggle.textContent = timerState.isRunning ? "Pause" : currentElapsedMs > 0 ? "Resume" : "Start";
  }
};

const startTimer = () => {
  if (timerState.isRunning) return;

  timerState.elapsedMs = normalizeElapsedMs(timerState.elapsedMs);
  timerState.startedAt = Date.now();
  timerState.isRunning = true;
  clearTimerInterval();
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
  clearTimerInterval();
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

  clearTimerInterval();
  timerState.elapsedMs = 0;
  timerState.startedAt = null;
  timerState.isRunning = false;
  localStorage.removeItem(STORAGE_KEYS.timer);
  renderTimer();
  saveLastUpdated();
};

const setupTimer = () => {
  restoreTimer();
  renderTimer();
  clearTimerInterval();

  if (timerState.isRunning) {
    timerIntervalId = window.setInterval(renderTimer, 1000);
  }

  document.getElementById("timer-toggle")?.addEventListener("click", toggleTimer);
  document.getElementById("timer-reset")?.addEventListener("click", resetTimer);
};

const saveLastUpdated = () => {
  const timestamp = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.lastUpdated, timestamp);
  document.getElementById("last-updated").textContent = formatDateTime(timestamp);
};

const getCheckboxes = () => checklistItems
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const readStoredChecklist = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.checklist) || "{}");
  } catch (error) {
    console.warn("Could not parse stored checklist state. Resetting state.", error);
    localStorage.removeItem(STORAGE_KEYS.checklist);
    return {};
  }
};

const saveChecklist = () => {
  const state = {};
  getCheckboxes().forEach((checkbox) => {
    state[checkbox.id] = checkbox.checked;
  });
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state));
  saveLastUpdated();
};

const updateProgress = () => {
  const checkboxes = getCheckboxes();
  const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
  const total = checkboxes.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("completed-count").textContent = String(completed);
  document.getElementById("total-count").textContent = String(total);
  document.getElementById("progress-fill").style.width = `${percentage}%`;

  checkboxes.forEach((checkbox) => {
    checkbox.closest(".check-item")?.classList.toggle("completed", checkbox.checked);
  });
};

const restoreChecklist = () => {
  const state = readStoredChecklist();
  getCheckboxes().forEach((checkbox) => {
    checkbox.checked = Boolean(state[checkbox.id]);
  });
  updateProgress();
};

const clearSetRowInterval = () => {
  if (setRowIntervalId === null) return;
  window.clearInterval(setRowIntervalId);
  setRowIntervalId = null;
};

const hasRunningSetRow = () => getAllSetRows().some((set) => getSetRowState(set.id)?.isRunning);

const getSetRowElement = (setId) => document.querySelector(`[data-set-row="${setId}"]`);

const getSetRowControl = (setId, suffix, selector) => {
  const row = getSetRowElement(setId);
  return document.getElementById(`${setId}-${suffix}`) || row?.querySelector(selector);
};

const renderSetRow = (set) => {
  const rowState = getSetRowState(set.id);
  if (!rowState) return;

  const elapsedMs = getCurrentSetRowElapsedMs(set.id);
  const row = getSetRowElement(set.id);
  const timer = getSetRowControl(set.id, "timer", ".set-time");
  const toggle = getSetRowControl(set.id, "toggle", ".set-play-button");
  const done = getSetRowControl(set.id, "done", 'input[type="checkbox"]');

  if (row) row.classList.toggle("completed", rowState.isDone);
  if (timer) timer.textContent = formatTimer(elapsedMs);
  if (toggle) {
    toggle.textContent = rowState.isRunning ? "❚❚" : "▶";
    toggle.setAttribute("aria-label", `${rowState.isRunning ? "Pause" : "Start"} ${set.id.replace("-", " set ")}`);
  }
  if (done) done.checked = rowState.isDone;
};

const renderExerciseSetTracker = (tracker) => {
  const count = document.getElementById(`${tracker.id}-set-count`);
  const total = document.getElementById(`${tracker.id}-set-total`);

  if (count) count.textContent = String(getCompletedSetCount(tracker));
  if (total) total.textContent = String(tracker.totalSets);
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
    getSetRowControl(set.id, "toggle", ".set-play-button")?.addEventListener("click", () => toggleSetRowTimer(set.id));
    getSetRowControl(set.id, "done", 'input[type="checkbox"]')?.addEventListener("change", (event) => setRowDone(set.id, event.target.checked));
  });

  exerciseSetTrackers.forEach((tracker) => {
    document.getElementById(`${tracker.id}-set-reset`)?.addEventListener("click", () => resetExerciseSetRows(tracker.id));
  });
};

const setupNotes = () => {
  const notes = document.getElementById("session-notes");
  const storedNotes = localStorage.getItem(STORAGE_KEYS.notes);
  if (storedNotes) notes.value = storedNotes;

  notes.addEventListener("input", () => {
    localStorage.setItem(STORAGE_KEYS.notes, notes.value);
    saveLastUpdated();
  });

  document.getElementById("clear-notes").addEventListener("click", () => {
    const shouldClear = window.confirm("Clear session notes? Your checklist progress will stay saved.");
    if (!shouldClear) return;
    notes.value = "";
    localStorage.removeItem(STORAGE_KEYS.notes);
    saveLastUpdated();
  });
};

const setupReset = () => {
  document.getElementById("reset-checklist").addEventListener("click", () => {
    const shouldReset = window.confirm("Reset all checklist items? Your notes will be kept.");
    if (!shouldReset) return;

    getCheckboxes().forEach((checkbox) => {
      checkbox.checked = false;
    });
    localStorage.removeItem(STORAGE_KEYS.checklist);
    saveLastUpdated();
    updateProgress();
  });
};

const setupChecklistListeners = () => {
  getCheckboxes().forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      saveChecklist();
      updateProgress();
    });
  });
};

const setupSessionMeta = () => {
  document.getElementById("session-date").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());

  document.getElementById("last-updated").textContent = formatDateTime(
    localStorage.getItem(STORAGE_KEYS.lastUpdated)
  );
};

document.addEventListener("DOMContentLoaded", () => {
  setupSessionMeta();
  restoreChecklist();
  setupChecklistListeners();
  setupNotes();
  setupReset();
  setupTimer();
  setupSetRows();
});
