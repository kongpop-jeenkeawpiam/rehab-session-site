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
  "bridge-setup",
  "bridge-core",
  "bridge-lift",
  "bridge-safety-check",
  "clam-setup",
  "clam-hip-stack",
  "clam-control",
  "clam-safety-check",
  "monitor-immediate",
  "monitor-next-morning",
  "monitor-walking"
];

const STORAGE_KEYS = {
  checklist: "kneeRehabChecklistState",
  notes: "kneeRehabNotes",
  lastUpdated: "kneeRehabLastUpdated",
  timer: "kneeRehabTimerState",
  sets: "kneeRehabSetRowState",
  completedDates: "kneeRehabCompletedDates",
  sessionHistory: "kneeRehabSessionHistory",
  voiceCuesEnabled: "kneeRehabVoiceCuesEnabled",
  checklistCollapse: "kneeRehabChecklistCollapseState"
};

const DEFAULT_COMPLETED_DATES = [
  "2026-05-19",
  "2026-05-20",
  "2026-05-21",
  "2026-05-22",
  "2026-05-23"
];

let timerIntervalId = null;

const timerState = {
  elapsedMs: 0,
  startedAt: null,
  isRunning: false
};

const audioCueState = {
  isEnabled: true,
  audioContext: null
};

const SET_ROW_CONFIG = {
  wall: { totalReps: 10, workDurationSec: 30, restDurationSec: 15, workCue: "Hold", restCue: "Resting", activeTargetPrefix: "Rep" },
  slr: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Hold", restCue: "Relax", activeTargetPrefix: "HOLD! - Rep" },
  bridge: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Lift", restCue: "Relax", activeTargetPrefix: "Rep" },
  clam: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Open", restCue: "Relax", activeTargetPrefix: "Rep" }
};

const getSetRowConfig = (setId) => {
  const trackerId = setId.split("-")[0];
  return SET_ROW_CONFIG[trackerId] || SET_ROW_CONFIG.slr;
};

const exerciseSetTrackers = [
  {
    id: "wall",
    label: "Wall Sit",
    totalSets: 2,
    sets: [
      { id: "wall-1", target: "10 reps" },
      { id: "wall-2", target: "10 reps" }
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
  },
  {
    id: "bridge",
    label: "Glute Bridges",
    totalSets: 2,
    sets: [
      { id: "bridge-1", target: "15 reps" },
      { id: "bridge-2", target: "15 reps" }
    ]
  },
  {
    id: "clam",
    label: "Clamshells",
    totalSets: 2,
    sets: [
      { id: "clam-1", target: "15 reps" },
      { id: "clam-2", target: "15 reps" }
    ]
  }
];

const exerciseProgressGroups = [
  {
    id: "wall",
    label: "Wall Sit",
    setIds: ["wall-1", "wall-2"],
    checkIds: [
      "wall-setup",
      "wall-angle",
      "wall-foot-position",
      "wall-data-check",
      "wall-safety-check"
    ]
  },
  {
    id: "slr",
    label: "Straight Leg Raise",
    setIds: ["slr-1", "slr-2", "slr-3"],
    checkIds: [
      "slr-setup",
      "slr-lock-twist",
      "slr-tempo-lift",
      "slr-tempo-hold",
      "slr-tempo-lower",
      "slr-data-check"
    ]
  },
  {
    id: "bridge",
    label: "Glute Bridges",
    setIds: ["bridge-1", "bridge-2"],
    checkIds: [
      "bridge-setup",
      "bridge-core",
      "bridge-lift",
      "bridge-safety-check"
    ]
  },
  {
    id: "clam",
    label: "Clamshells",
    setIds: ["clam-1", "clam-2"],
    checkIds: [
      "clam-setup",
      "clam-hip-stack",
      "clam-control",
      "clam-safety-check"
    ]
  }
];

let setRowIntervalId = null;

const today = new Date();

const calendarState = {
  visibleDate: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDateKey: null,
  completedDates: new Set(),
  sessionHistory: {}
};

const setRowState = {
  "wall-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 10, currentRep: 1, repState: "work", timeRemainingSec: 30, workDurationSec: 30, restDurationSec: 15 },
  "wall-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 10, currentRep: 1, repState: "work", timeRemainingSec: 30, workDurationSec: 30, restDurationSec: 15 },
  "slr-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "slr-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "slr-3": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "bridge-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "bridge-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "clam-1": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 },
  "clam-2": { elapsedMs: 0, startedAt: null, isRunning: false, isDone: false, isRepLoop: true, totalReps: 15, currentRep: 1, repState: "work", timeRemainingSec: 5, workDurationSec: 5, restDurationSec: 3 }
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

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createDateFromKey = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDisplayDate = (dateKey) => {
  const date = createDateFromKey(dateKey);
  if (!date) return "Select a date";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
};

const isFutureDateKey = (dateKey) => {
  const date = createDateFromKey(dateKey);
  if (!date) return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return date.getTime() > todayStart.getTime();
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

const getCompletedCheckCount = (checkIds) => checkIds
  .filter((checkId) => document.getElementById(checkId)?.checked)
  .length;

const getExerciseProgressStats = (group) => {
  const completedSets = group.setIds
    .filter((setId) => getSetRowState(setId)?.isDone)
    .length;
  const completedChecks = getCompletedCheckCount(group.checkIds);
  const totalSets = group.setIds.length;
  const totalChecks = group.checkIds.length;
  const isFinished = completedSets === totalSets && completedChecks === totalChecks;
  const hasStarted = completedSets > 0 || completedChecks > 0;

  return {
    completedSets: completedSets,
    completedChecks: completedChecks,
    totalSets: totalSets,
    totalChecks: totalChecks,
    status: isFinished ? "Finished" : hasStarted ? "In progress" : "Not started",
    statusClass: isFinished ? "finished" : hasStarted ? "in-progress" : "not-started",
    isFinished: isFinished
  };
};

const hasFinishedExercise = () => exerciseProgressGroups
  .some((group) => getExerciseProgressStats(group).isFinished);

const hasCompletedImmediateSafetyCheck = () => document.getElementById("monitor-immediate")?.checked === true;

const canCompleteToday = () => hasFinishedExercise() && hasCompletedImmediateSafetyCheck();

const renderExerciseProgress = () => {
  exerciseProgressGroups.forEach((group) => {
    const stats = getExerciseProgressStats(group);
    const row = document.querySelector(`[data-exercise-progress="${group.id}"]`);
    const sets = document.getElementById(`${group.id}-progress-sets`);
    const checks = document.getElementById(`${group.id}-progress-checks`);
    const status = document.getElementById(`${group.id}-progress-status`);

    if (sets) sets.textContent = `${stats.completedSets} / ${stats.totalSets}`;
    if (checks) checks.textContent = `${stats.completedChecks} / ${stats.totalChecks}`;
    if (status) status.textContent = stats.status;

    if (row) {
      row.classList.toggle("finished", stats.statusClass === "finished");
      row.classList.toggle("in-progress", stats.statusClass === "in-progress");
      row.classList.toggle("not-started", stats.statusClass === "not-started");
    }
  });
};

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
      isDone: rowState.isDone === true,
      isRepLoop: rowState.isRepLoop === true,
      totalReps: rowState.totalReps,
      currentRep: rowState.currentRep,
      repState: rowState.repState,
      timeRemainingSec: rowState.timeRemainingSec,
      workDurationSec: rowState.workDurationSec,
      restDurationSec: rowState.restDurationSec
    };
  });

  localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(state));
  saveTodaySessionHistory();
};

const restoreSetRows = () => {
  const storedRows = readStoredSetRows();

  getAllSetRows().forEach((set) => {
    const storedState = storedRows[set.id];
    const startedAt = Number(storedState?.startedAt);
    const isRepLoop = true;
    const config = getSetRowConfig(set.id);
    const totalReps = config.totalReps;
    const workDurationSec = config.workDurationSec;
    const restDurationSec = config.restDurationSec;

    setRowState[set.id].elapsedMs = normalizeElapsedMs(storedState?.elapsedMs);
    setRowState[set.id].startedAt = Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
    setRowState[set.id].isRunning = storedState?.isRunning === true && setRowState[set.id].startedAt !== null;
    setRowState[set.id].isDone = storedState?.isDone === true;

    setRowState[set.id].isRepLoop = isRepLoop;
    setRowState[set.id].totalReps = Number(storedState?.totalReps) || totalReps;
    setRowState[set.id].currentRep = Number(storedState?.currentRep) || 1;
    setRowState[set.id].repState = storedState?.repState || "work";
    setRowState[set.id].timeRemainingSec = typeof storedState?.timeRemainingSec === "number" ? storedState.timeRemainingSec : workDurationSec;
    setRowState[set.id].workDurationSec = Number(storedState?.workDurationSec) || workDurationSec;
    setRowState[set.id].restDurationSec = Number(storedState?.restDurationSec) || restDurationSec;
    setRowState[set.id].isRunning = false; // keep it paused on refresh
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

const getChecklistStats = () => {
  const checkboxes = getCheckboxes();
  return {
    checkboxes: checkboxes,
    completed: checkboxes.filter((checkbox) => checkbox.checked).length,
    total: checkboxes.length
  };
};

const readStoredChecklist = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.checklist) || "{}");
  } catch (error) {
    console.warn("Could not parse stored checklist state. Resetting state.", error);
    localStorage.removeItem(STORAGE_KEYS.checklist);
    return {};
  }
};

const getValidCompletedDates = (dates) => Array.from(new Set(dates))
  .filter((dateKey) => createDateFromKey(dateKey))
  .sort();

const readStoredCompletedDates = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.completedDates);
    if (storedValue === null) {
      const defaultDates = getValidCompletedDates(DEFAULT_COMPLETED_DATES);
      localStorage.setItem(STORAGE_KEYS.completedDates, JSON.stringify(defaultDates));
      return defaultDates;
    }

    const storedDates = JSON.parse(storedValue);
    if (!Array.isArray(storedDates)) {
      const defaultDates = getValidCompletedDates(DEFAULT_COMPLETED_DATES);
      localStorage.setItem(STORAGE_KEYS.completedDates, JSON.stringify(defaultDates));
      return defaultDates;
    }

    return getValidCompletedDates(storedDates);
  } catch (error) {
    console.warn("Could not parse completed calendar dates. Resetting calendar history.", error);
    const defaultDates = getValidCompletedDates(DEFAULT_COMPLETED_DATES);
    localStorage.setItem(STORAGE_KEYS.completedDates, JSON.stringify(defaultDates));
    return defaultDates;
  }
};

const readStoredSessionHistory = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.sessionHistory);
    if (storedValue === null) return {};

    const storedHistory = JSON.parse(storedValue);
    if (!storedHistory || typeof storedHistory !== "object" || Array.isArray(storedHistory)) {
      localStorage.removeItem(STORAGE_KEYS.sessionHistory);
      return {};
    }

    return Object.entries(storedHistory).reduce((history, [dateKey, record]) => {
      if (createDateFromKey(dateKey) && record && typeof record === "object" && !Array.isArray(record)) {
        history[dateKey] = record;
      }
      return history;
    }, {});
  } catch (error) {
    console.warn("Could not parse session history. Resetting detailed history.", error);
    localStorage.removeItem(STORAGE_KEYS.sessionHistory);
    return {};
  }
};

const writeSessionHistory = () => {
  localStorage.setItem(STORAGE_KEYS.sessionHistory, JSON.stringify(calendarState.sessionHistory));
};

const syncCompletedDatesWithHistory = () => {
  Object.entries(calendarState.sessionHistory).forEach(([dateKey, record]) => {
    if (record?.completed === true) {
      calendarState.completedDates.add(dateKey);
    } else if (record?.completed === false) {
      calendarState.completedDates.delete(dateKey);
    }
  });
  localStorage.setItem(
    STORAGE_KEYS.completedDates,
    JSON.stringify(getValidCompletedDates(Array.from(calendarState.completedDates)))
  );
};

const saveCompletedDates = () => {
  const completedDates = getValidCompletedDates(Array.from(calendarState.completedDates));
  calendarState.completedDates = new Set(completedDates);
  localStorage.setItem(STORAGE_KEYS.completedDates, JSON.stringify(completedDates));
  saveLastUpdated();
};

const getCurrentNotes = () => document.getElementById("session-notes")?.value || "";

const getMonitoringHistorySnapshot = () => ({
  immediate: document.getElementById("monitor-immediate")?.checked === true,
  nextMorning: document.getElementById("monitor-next-morning")?.checked === true,
  walking: document.getElementById("monitor-walking")?.checked === true
});

const getExerciseHistorySnapshot = () => exerciseProgressGroups.reduce((exercises, group) => {
  const stats = getExerciseProgressStats(group);

  exercises[group.id] = {
    label: group.label,
    status: stats.status,
    completedSets: stats.completedSets,
    totalSets: stats.totalSets,
    completedChecks: stats.completedChecks,
    totalChecks: stats.totalChecks
  };

  return exercises;
}, {});

const createCurrentSessionHistoryRecord = (dateKey, options = {}) => {
  const existingRecord = calendarState.sessionHistory[dateKey] || {};
  const completed = options.completed ?? existingRecord.completed ?? calendarState.completedDates.has(dateKey);
  const manualCompletion = options.manualCompletion ?? existingRecord.manualCompletion ?? false;

  return {
    dateKey: dateKey,
    completed: Boolean(completed),
    manualCompletion: Boolean(manualCompletion),
    updatedAt: new Date().toISOString(),
    exercises: getExerciseHistorySnapshot(),
    monitoring: getMonitoringHistorySnapshot(),
    notes: getCurrentNotes()
  };
};

const createMinimalSessionHistoryRecord = (dateKey, completed) => {
  const existingRecord = calendarState.sessionHistory[dateKey] || {};

  return {
    dateKey: dateKey,
    completed: Boolean(completed),
    manualCompletion: true,
    updatedAt: new Date().toISOString(),
    exercises: existingRecord.exercises || {},
    monitoring: existingRecord.monitoring || {},
    notes: existingRecord.notes || ""
  };
};

const saveTodaySessionHistory = (options = {}) => {
  const todayKey = formatDateKey(new Date());
  calendarState.sessionHistory[todayKey] = createCurrentSessionHistoryRecord(todayKey, options);
  writeSessionHistory();
};

const saveSelectedDateCompletionHistory = (dateKey, completed) => {
  if (!dateKey) return;

  const todayKey = formatDateKey(new Date());
  calendarState.sessionHistory[dateKey] = dateKey === todayKey
    ? createCurrentSessionHistoryRecord(dateKey, { completed: completed, manualCompletion: true })
    : createMinimalSessionHistoryRecord(dateKey, completed);
  writeSessionHistory();
};

const createHistoryText = (text, className) => {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  return element;
};

const renderExerciseHistory = (container, exercises) => {
  const list = document.createElement("div");
  list.className = "history-exercise-list";

  exerciseProgressGroups.forEach((group) => {
    const exercise = exercises?.[group.id];
    const row = document.createElement("div");
    row.className = "history-exercise-row";

    const name = document.createElement("strong");
    name.textContent = group.label;

    const details = document.createElement("span");
    details.textContent = exercise
      ? `${exercise.completedSets || 0} / ${exercise.totalSets || group.setIds.length} sets, ${exercise.completedChecks || 0} / ${exercise.totalChecks || group.checkIds.length} checks`
      : "No detail saved";

    const status = document.createElement("span");
    status.className = "history-status-badge";
    status.textContent = exercise?.status || "No detail";
    status.classList.add(
      exercise?.status === "Finished" ? "finished" : exercise?.status === "In progress" ? "in-progress" : "not-started"
    );

    row.append(name, details, status);
    list.appendChild(row);
  });

  container.appendChild(list);
};

const renderMonitoringHistory = (container, monitoring) => {
  const monitoringItems = [
    ["Immediate", monitoring?.immediate],
    ["Next morning", monitoring?.nextMorning],
    ["Walking", monitoring?.walking]
  ];
  const completedCount = monitoringItems.filter((item) => item[1] === true).length;
  const summary = createHistoryText(`Monitoring: ${completedCount} / ${monitoringItems.length} complete`, "history-summary");
  const list = document.createElement("ul");
  list.className = "history-monitoring-list";

  monitoringItems.forEach(([label, isComplete]) => {
    const item = document.createElement("li");
    item.textContent = `${label}: ${isComplete ? "Done" : "Not done"}`;
    list.appendChild(item);
  });

  container.append(summary, list);
};

const renderSessionHistory = () => {
  const panel = document.getElementById("session-history-panel");
  if (!panel) return;

  const dateKey = calendarState.selectedDateKey;
  panel.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Session History";
  panel.appendChild(heading);

  if (!dateKey) {
    panel.appendChild(createHistoryText("Select a date to see saved progress.", "history-empty"));
    return;
  }

  const record = calendarState.sessionHistory[dateKey];
  if (!record) {
    const message = calendarState.completedDates.has(dateKey)
      ? "Completed, no detailed session saved."
      : "No session recorded.";
    panel.appendChild(createHistoryText(message, "history-empty"));
    return;
  }

  const completionText = record.completed ? "Completed" : "Not completed";
  const updatedText = record.updatedAt ? formatDateTime(record.updatedAt) : "No update time saved";
  panel.appendChild(createHistoryText(`${completionText} • Updated ${updatedText}`, "history-summary"));

  renderExerciseHistory(panel, record.exercises);
  renderMonitoringHistory(panel, record.monitoring);

  const notes = document.createElement("div");
  notes.className = "history-notes";
  const notesLabel = document.createElement("strong");
  notesLabel.textContent = "Notes";
  const notesText = document.createElement("p");
  notesText.textContent = record.notes?.trim() || "No notes saved.";
  notes.append(notesLabel, notesText);
  panel.appendChild(notes);
};

const selectCalendarDate = (dateKey) => {
  calendarState.selectedDateKey = dateKey;
  renderCalendar();
};

const toggleDateCompletion = (dateKey) => {
  if (!dateKey || isFutureDateKey(dateKey)) return;

  let isCompleted = false;
  if (calendarState.completedDates.has(dateKey)) {
    calendarState.completedDates.delete(dateKey);
  } else {
    calendarState.completedDates.add(dateKey);
    isCompleted = true;
  }

  saveSelectedDateCompletionHistory(dateKey, isCompleted);
  saveCompletedDates();
  renderCalendar();
};

const markTodayComplete = () => {
  const todayKey = formatDateKey(new Date());
  calendarState.completedDates.add(todayKey);
  calendarState.selectedDateKey = todayKey;
  saveTodaySessionHistory({ completed: true, manualCompletion: true });
  saveCompletedDates();
  renderCalendar();
};

const renderSelectedDay = () => {
  const selectedDate = document.getElementById("selected-calendar-date");
  const toggleButton = document.getElementById("toggle-selected-complete");
  const dateKey = calendarState.selectedDateKey;

  if (selectedDate) {
    selectedDate.textContent = dateKey ? formatDisplayDate(dateKey) : "Select a date";
  }

  if (!toggleButton) return;

  const isFutureDate = dateKey ? isFutureDateKey(dateKey) : false;
  const isCompleted = dateKey ? calendarState.completedDates.has(dateKey) : false;

  toggleButton.disabled = !dateKey || isFutureDate;
  toggleButton.textContent = isCompleted ? "Unmark Complete" : "Mark Complete";
  renderSessionHistory();
};

const renderTodayCompletionButton = () => {
  const markTodayButton = document.getElementById("mark-today-complete");
  if (!markTodayButton) return;

  const todayKey = formatDateKey(new Date());
  const isComplete = calendarState.completedDates.has(todayKey);
  const canMarkToday = canCompleteToday() && !isComplete;

  markTodayButton.disabled = !canMarkToday;
  markTodayButton.textContent = isComplete ? "Today Completed" : "Mark Today Complete";
};

const renderCalendar = () => {
  const calendarMonth = document.getElementById("calendar-month");
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) return;

  const year = calendarState.visibleDate.getFullYear();
  const month = calendarState.visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());

  if (calendarMonth) {
    calendarMonth.textContent = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric"
    }).format(firstDay);
  }

  calendarGrid.replaceChildren();

  for (let index = 0; index < firstDay.getDay(); index++) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "calendar-day empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    const dayButton = document.createElement("button");
    const isCompleted = calendarState.completedDates.has(dateKey);
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === calendarState.selectedDateKey;

    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.textContent = String(day);
    dayButton.setAttribute("aria-label", `${formatDisplayDate(dateKey)}${isCompleted ? ", completed" : ""}`);
    dayButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
    dayButton.classList.toggle("completed", isCompleted);
    dayButton.classList.toggle("today", isToday);
    dayButton.classList.toggle("selected", isSelected);
    dayButton.classList.toggle("future", isFutureDateKey(dateKey));
    dayButton.addEventListener("click", () => selectCalendarDate(dateKey));

    calendarGrid.appendChild(dayButton);
  }

  const trailingCells = (7 - (calendarGrid.children.length % 7)) % 7;
  for (let index = 0; index < trailingCells; index++) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "calendar-day empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(emptyCell);
  }

  renderSelectedDay();
  renderTodayCompletionButton();
};

const setupCalendar = () => {
  calendarState.sessionHistory = readStoredSessionHistory();
  calendarState.completedDates = new Set(readStoredCompletedDates());
  syncCompletedDatesWithHistory();
  calendarState.selectedDateKey = formatDateKey(new Date());
  renderCalendar();

  document.getElementById("calendar-prev")?.addEventListener("click", () => {
    calendarState.visibleDate = new Date(
      calendarState.visibleDate.getFullYear(),
      calendarState.visibleDate.getMonth() - 1,
      1
    );
    renderCalendar();
  });

  document.getElementById("calendar-next")?.addEventListener("click", () => {
    calendarState.visibleDate = new Date(
      calendarState.visibleDate.getFullYear(),
      calendarState.visibleDate.getMonth() + 1,
      1
    );
    renderCalendar();
  });

  document.getElementById("mark-today-complete")?.addEventListener("click", markTodayComplete);
  document.getElementById("toggle-selected-complete")?.addEventListener("click", () => {
    toggleDateCompletion(calendarState.selectedDateKey);
  });
};

const saveChecklist = () => {
  const state = {};
  getCheckboxes().forEach((checkbox) => {
    state[checkbox.id] = checkbox.checked;
  });
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state));
  saveTodaySessionHistory();
  saveLastUpdated();
};

const updateProgress = () => {
  const { checkboxes, completed, total } = getChecklistStats();
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("completed-count").textContent = String(completed);
  document.getElementById("total-count").textContent = String(total);
  document.getElementById("progress-fill").style.width = `${percentage}%`;

  checkboxes.forEach((checkbox) => {
    checkbox.closest(".check-item")?.classList.toggle("completed", checkbox.checked);
  });

  renderExerciseProgress();
  renderTodayCompletionButton();
  renderSessionHistory();
};

const restoreChecklist = () => {
  const state = readStoredChecklist();
  getCheckboxes().forEach((checkbox) => {
    checkbox.checked = Boolean(state[checkbox.id]);
  });
  updateProgress();
};

const readStoredVoiceCuePreference = () => {
  const storedValue = localStorage.getItem(STORAGE_KEYS.voiceCuesEnabled);
  if (storedValue === null) return true;
  return storedValue === "true";
};

const saveVoiceCuePreference = () => {
  localStorage.setItem(STORAGE_KEYS.voiceCuesEnabled, String(audioCueState.isEnabled));
};

const getAudioContext = () => {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  if (!audioCueState.audioContext) {
    audioCueState.audioContext = new AudioContextConstructor();
  }

  return audioCueState.audioContext;
};

const unlockAudioCues = () => {
  if (!audioCueState.isEnabled) return;

  try {
    const audioContext = getAudioContext();
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
  } catch (error) {
    console.warn("Audio cue unlock failed", error);
  }
};

const playCueBeep = (frequency = 800, duration = 0.15) => {
  if (!audioCueState.isEnabled) return;

  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (error) {
    console.warn("Audio cue beep failed", error);
  }
};

const speakCue = (message) => {
  if (!audioCueState.isEnabled || !("speechSynthesis" in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Voice cue failed", error);
  }
};

const playAudioCue = (message, frequency = 800, duration = 0.15) => {
  if (!audioCueState.isEnabled) return;

  unlockAudioCues();
  speakCue(message);
  playCueBeep(frequency, duration);
};

const getWorkCueMessage = (setId) => getSetRowConfig(setId).workCue;

const getRestCueMessage = (setId) => getSetRowConfig(setId).restCue;

const playCurrentPhaseCue = (setId) => {
  const state = getSetRowState(setId);
  if (!state || state.isDone) return;

  if (state.repState === "work") {
    const message = getWorkCueMessage(setId);
    if (message) playAudioCue(message, 800, 0.2);
    return;
  }

  if (state.repState === "rest") {
    playAudioCue(getRestCueMessage(setId), 600, 0.18);
  }
};

const renderVoiceCueControl = () => {
  const toggle = document.getElementById("voice-cues-toggle");
  const status = document.getElementById("voice-cues-status");

  if (toggle) toggle.checked = audioCueState.isEnabled;
  if (status) status.textContent = audioCueState.isEnabled ? "Voice cues on" : "Voice cues off";
};

const setupVoiceCues = () => {
  audioCueState.isEnabled = readStoredVoiceCuePreference();
  renderVoiceCueControl();

  document.getElementById("voice-cues-toggle")?.addEventListener("change", (event) => {
    audioCueState.isEnabled = event.target.checked;
    saveVoiceCuePreference();
    renderVoiceCueControl();

    if (audioCueState.isEnabled) {
      playAudioCue("Voice cues on", 880, 0.12);
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });
};

const triggerVisualFlash = (element) => {
  if (!element) return;
  element.classList.add("flash-highlight");
  window.setTimeout(() => {
    element.classList.remove("flash-highlight");
  }, 600);
};

const handleRepLoopTick = (setId) => {
  const state = setRowState[setId];
  if (!state || !state.isRunning) return;

  if (state.timeRemainingSec > 0) {
    state.timeRemainingSec--;
  }

  if (state.timeRemainingSec === 0) {
    const rowEl = getSetRowElement(setId);
    
    if (state.repState === "work") {
      triggerVisualFlash(rowEl);

      if (state.currentRep < state.totalReps) {
        state.repState = "rest";
        state.timeRemainingSec = state.restDurationSec;
        playAudioCue(getRestCueMessage(setId), 600, 0.2);
      } else {
        state.isRunning = false;
        state.isDone = true;
        state.currentRep = state.totalReps;
        state.repState = "completed";
        state.timeRemainingSec = 0;
        playAudioCue("Set complete", 1200, 0.6);
        setRowDone(setId, true);
      }
    } else if (state.repState === "rest") {
      triggerVisualFlash(rowEl);

      state.currentRep++;
      state.repState = "work";
      state.timeRemainingSec = state.workDurationSec;
      playCurrentPhaseCue(setId);
    }
  }

  saveSetRows();
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

  const row = getSetRowElement(set.id);
  const timer = getSetRowControl(set.id, "timer", ".set-time");
  const toggle = getSetRowControl(set.id, "toggle", ".set-play-button");
  const done = getSetRowControl(set.id, "done", 'input[type="checkbox"]');
  const targetSpan = getSetRowControl(set.id, "target", ".set-target");

  if (row) row.classList.toggle("completed", rowState.isDone);

  if (rowState.isRepLoop) {
    if (timer) {
      const minutes = Math.floor(rowState.timeRemainingSec / 60);
      const seconds = rowState.timeRemainingSec % 60;
      timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    if (targetSpan) {
      const config = getSetRowConfig(set.id);
      if (rowState.isDone) {
        targetSpan.textContent = `${rowState.totalReps} reps done`;
      } else if (rowState.repState === "work") {
        targetSpan.textContent = `${config.activeTargetPrefix} ${rowState.currentRep}/${rowState.totalReps}`;
      } else if (rowState.repState === "rest") {
        targetSpan.textContent = `${config.restCue}...`;
      } else {
        targetSpan.textContent = `${rowState.totalReps} reps`;
      }
    }
  } else {
    const elapsedMs = getCurrentSetRowElapsedMs(set.id);
    if (timer) timer.textContent = formatTimer(elapsedMs);
    if (targetSpan) targetSpan.textContent = set.target;
  }

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
  renderExerciseProgress();
  renderTodayCompletionButton();
  renderSessionHistory();
};

const ensureSetRowInterval = () => {
  clearSetRowInterval();
  if (hasRunningSetRow()) {
    setRowIntervalId = window.setInterval(() => {
      getAllSetRows().forEach((set) => {
        const state = setRowState[set.id];
        if (state?.isRunning && state?.isRepLoop) {
          handleRepLoopTick(set.id);
        }
      });
      renderSetRows();
    }, 1000);
  }
};

const pauseSetRow = (setId) => {
  const rowState = getSetRowState(setId);
  if (!rowState?.isRunning) return;

  if (rowState.isRepLoop) {
    rowState.isRunning = false;
  } else {
    rowState.elapsedMs = getCurrentSetRowElapsedMs(setId);
    rowState.startedAt = null;
    rowState.isRunning = false;
  }
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
    if (rowState.isRepLoop) {
      rowState.isRunning = true;
      playCurrentPhaseCue(setId);
    } else {
      rowState.elapsedMs = normalizeElapsedMs(rowState.elapsedMs);
      rowState.startedAt = Date.now();
      rowState.isRunning = true;
      unlockAudioCues();
    }
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
    if (rowState.isRepLoop) {
      rowState.currentRep = rowState.totalReps;
      rowState.repState = "completed";
      rowState.timeRemainingSec = 0;
    }
  } else {
    if (rowState.isRepLoop) {
      rowState.currentRep = 1;
      rowState.repState = "work";
      rowState.timeRemainingSec = rowState.workDurationSec;
    }
  }

  saveSetRows();
  renderSetRows();
  ensureSetRowInterval();
  saveLastUpdated();
};

const resetSetRowsForTrackers = (trackers) => {
  trackers.forEach((tracker) => {
    tracker.sets.forEach((set) => {
      const config = getSetRowConfig(set.id);
      const totalReps = config.totalReps;
      const workDurationSec = config.workDurationSec;
      const restDurationSec = config.restDurationSec;

      setRowState[set.id] = {
        elapsedMs: 0,
        startedAt: null,
        isRunning: false,
        isDone: false,
        isRepLoop: true,
        totalReps: totalReps,
        currentRep: 1,
        repState: "work",
        timeRemainingSec: workDurationSec,
        workDurationSec: workDurationSec,
        restDurationSec: restDurationSec
      };
    });
  });

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

  resetSetRowsForTrackers([tracker]);
};

const resetAllSetRows = () => {
  const shouldReset = window.confirm("Reset all exercise set rows? Your checklist, notes, and session timer will stay saved.");
  if (!shouldReset) return;

  resetSetRowsForTrackers(exerciseSetTrackers);
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

  document.getElementById("reset-all-sets")?.addEventListener("click", resetAllSetRows);
};

const setupNotes = () => {
  const notes = document.getElementById("session-notes");
  const storedNotes = localStorage.getItem(STORAGE_KEYS.notes);
  if (storedNotes) notes.value = storedNotes;

  notes.addEventListener("input", () => {
    localStorage.setItem(STORAGE_KEYS.notes, notes.value);
    saveTodaySessionHistory();
    renderSessionHistory();
    saveLastUpdated();
  });

  document.getElementById("clear-notes").addEventListener("click", () => {
    const shouldClear = window.confirm("Clear session notes? Your checklist progress will stay saved.");
    if (!shouldClear) return;
    notes.value = "";
    localStorage.removeItem(STORAGE_KEYS.notes);
    saveTodaySessionHistory();
    renderSessionHistory();
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
    updateProgress();
    saveTodaySessionHistory();
    renderSessionHistory();
    saveLastUpdated();
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

const readStoredChecklistCollapse = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.checklistCollapse);
    if (storedValue === null) return {};

    const storedState = JSON.parse(storedValue);
    if (!storedState || typeof storedState !== "object" || Array.isArray(storedState)) {
      localStorage.removeItem(STORAGE_KEYS.checklistCollapse);
      return {};
    }

    return storedState;
  } catch (error) {
    console.warn("Could not parse checklist collapse state. Resetting collapse controls.", error);
    localStorage.removeItem(STORAGE_KEYS.checklistCollapse);
    return {};
  }
};

const saveChecklistCollapse = () => {
  const state = {};

  document.querySelectorAll(".checklist-toggle[aria-controls]").forEach((toggle) => {
    const checklistId = toggle.getAttribute("aria-controls");
    const checklist = checklistId ? document.getElementById(checklistId) : null;
    if (checklist) state[checklistId] = checklist.hidden === true;
  });

  localStorage.setItem(STORAGE_KEYS.checklistCollapse, JSON.stringify(state));
};

const setChecklistCollapsed = (toggle, checklist, isCollapsed) => {
  checklist.hidden = isCollapsed;
  toggle.setAttribute("aria-expanded", String(!isCollapsed));
  toggle.textContent = isCollapsed ? "Show Checklist" : "Hide Checklist";
};

const setupChecklistCollapse = () => {
  const storedState = readStoredChecklistCollapse();

  document.querySelectorAll(".checklist-toggle[aria-controls]").forEach((toggle) => {
    const checklistId = toggle.getAttribute("aria-controls");
    const checklist = checklistId ? document.getElementById(checklistId) : null;
    if (!checklist) return;

    setChecklistCollapsed(toggle, checklist, storedState[checklistId] === true);

    toggle.addEventListener("click", () => {
      setChecklistCollapsed(toggle, checklist, !checklist.hidden);
      saveChecklistCollapse();
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
  setupCalendar();
  restoreChecklist();
  setupChecklistListeners();
  setupChecklistCollapse();
  setupVoiceCues();
  setupNotes();
  setupReset();
  setupTimer();
  setupSetRows();
});
