import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

class MockClassList {
  constructor() {
    this.classes = new Set();
  }

  add(...names) {
    names.forEach((name) => this.classes.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.classes.delete(name));
  }

  toggle(name, force) {
    const shouldHave = force === undefined ? !this.classes.has(name) : Boolean(force);
    if (shouldHave) {
      this.classes.add(name);
    } else {
      this.classes.delete(name);
    }
    return shouldHave;
  }

  contains(name) {
    return this.classes.has(name);
  }
}

class MockElement {
  constructor(id = "") {
    this.id = id;
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.classList = new MockClassList();
    this.parentElement = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(type, event = {}) {
    (this.listeners[type] || []).forEach((handler) => handler(event));
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    if (node && typeof node === "object") {
      node.parentElement = this;
      this.children.push(node);
    }
    return node;
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  closest() {
    return null;
  }

  querySelector() {
    return null;
  }
}

const createTestHarness = (initialIsoNow) => {
  let currentNowMs = new Date(initialIsoNow).getTime();

  class FakeDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(currentNowMs);
      } else {
        super(...args);
      }
    }

    static now() {
      return currentNowMs;
    }
  }

  const storage = new Map();
  const elements = new Map();
  const ensureElement = (id) => {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(id));
    }
    return elements.get(id);
  };

  [
    "session-date",
    "last-updated",
    "completed-count",
    "total-count",
    "progress-fill",
    "session-notes",
    "clear-notes",
    "reset-checklist",
    "reset-all-sets",
    "calendar-month",
    "calendar-grid",
    "calendar-prev",
    "calendar-next",
    "mark-today-complete",
    "selected-calendar-date",
    "toggle-selected-complete",
    "session-history-panel",
    "todays-summary-date",
    "todays-summary-text",
    "summary-mark-today-complete",
    "copy-session-summary",
    "copy-session-summary-status",
    "pain-before",
    "pain-after",
    "swelling-status",
    "sharp-pain",
    "phase-completed",
    "safety-alert",
    "mobile-session-overview",
    "mobile-session-heading",
    "mobile-session-date",
    "mobile-session-current",
    "mobile-session-progress",
    "mobile-session-position",
    "mobile-session-previous",
    "mobile-session-next",
    "mobile-session-more",
    "mobile-session-step-list"
  ].forEach(ensureElement);

  const checklistIds = [
    "wall-setup",
    "wall-angle",
    "wall-foot-position",
    "wall-data-check",
    "wall-safety-check",
    "quad-set-setup",
    "quad-set-vmo",
    "quad-set-safety",
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
    "side-leg-lift-setup",
    "side-leg-lift-control",
    "side-leg-lift-safety",
    "chair-squat-support",
    "chair-squat-hip-hinge",
    "chair-squat-safety",
    "mini-single-leg-squat-support",
    "mini-single-leg-squat-depth",
    "mini-single-leg-squat-safety",
    "monitor-immediate",
    "monitor-next-morning",
    "monitor-walking"
  ];
  checklistIds.forEach(ensureElement);

  const documentListeners = {};
  const windowListeners = {};

  const localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  };

  const document = {
    title: "",
    visibilityState: "visible",
    body: new MockElement("body"),
    documentElement: new MockElement("html"),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, handler) => {
      if (!documentListeners[type]) documentListeners[type] = [];
      documentListeners[type].push(handler);
    }
  };

  const window = {
    navigator: { language: "en-US" },
    matchMedia: () => ({
      matches: true,
      addEventListener: () => {}
    }),
    setTimeout: (fn) => {
      fn();
      return 1;
    },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    confirm: () => true,
    addEventListener: (type, handler) => {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(handler);
    }
  };

  const context = vm.createContext({
    console,
    Date: FakeDate,
    Intl,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    Math,
    localStorage,
    document,
    window,
    navigator: window.navigator
  });

  vm.runInContext(script, context);

  return {
    context,
    elements,
    storage,
    setNow: (isoString) => {
      currentNowMs = new Date(isoString).getTime();
    },
    triggerDocumentEvent: (type) => {
      (documentListeners[type] || []).forEach((fn) => fn());
    },
    triggerWindowEvent: (type) => {
      (windowListeners[type] || []).forEach((fn) => fn());
    }
  };
};

// 1. Opening on a new day should NOT carry over yesterday's checklist, sets, notes, or last-updated
{
  const harness = createTestHarness("2026-10-29T09:00:00+07:00");
  const { context, elements, storage } = harness;

  const yesterdayChecklist = {
    "wall-setup": true,
    "quad-set-setup": true,
    "monitor-immediate": true
  };
  const yesterdaySets = {
    "quad-set-1": {
      elapsedMs: 0,
      startedAt: null,
      isRunning: false,
      isDone: true,
      isRepLoop: true,
      totalReps: 10,
      currentRep: 10,
      repState: "completed",
      timeRemainingSec: 0,
      workDurationSec: 5,
      restDurationSec: 5
    }
  };

  storage.set("kneeRehabChecklistState", JSON.stringify(yesterdayChecklist));
  storage.set("kneeRehabSetRowState", JSON.stringify(yesterdaySets));
  storage.set("kneeRehabNotes", "Yesterday knee felt fine");
  storage.set("kneeRehabLastUpdated", "2026-10-28T21:00:00+07:00");
  storage.set("kneeRehabSessionHistory", JSON.stringify({
    "2026-10-28": {
      dateKey: "2026-10-28",
      completed: true,
      manualCompletion: true,
      updatedAt: "2026-10-28T21:00:00+07:00",
      checklist: yesterdayChecklist,
      setRows: yesterdaySets,
      exercises: {},
      monitoring: { immediate: true },
      notes: "Yesterday knee felt fine"
    }
  }));

  vm.runInContext(`
    setupCalendar();
    restoreChecklist();
    setupChecklistListeners();
    setupNotes();
    setupSetRows();
    applySelectedDateSession();
  `, context);

  assert.equal(elements.get("wall-setup").checked, false, "new day should not keep yesterday's checked wall-setup");
  assert.equal(elements.get("quad-set-setup").checked, false, "new day should not keep yesterday's checked quad-set-setup");
  assert.equal(elements.get("completed-count").textContent, "0", "new day should start at 0 completed checks");
  assert.equal(elements.get("session-notes").value, "", "new day should start with empty notes");
  assert.equal(elements.get("last-updated").textContent, "Not started yet", "new day should show Not started yet");
  assert.equal(
    vm.runInContext(`getSetRowState("quad-set-1").isDone`, context),
    false,
    "new day should reset set completion state"
  );

  // Yesterday's history must remain intact when selecting yesterday
  vm.runInContext(`selectCalendarDate("2026-10-28");`, context);
  assert.equal(elements.get("wall-setup").checked, true, "selecting yesterday should still show yesterday's checked items");
  assert.equal(elements.get("session-notes").value, "Yesterday knee felt fine", "selecting yesterday should show yesterday's notes");
  assert.equal(
    vm.runInContext(`Boolean(calendarState.sessionHistory["2026-10-29"])`, context),
    false,
    "merely viewing yesterday without touching today should not save a ghost history record for today"
  );
}

// 2. Legacy localStorage without sessionHistory should only apply if lastUpdated is from today
{
  const staleHarness = createTestHarness("2026-10-29T09:00:00+07:00");
  staleHarness.storage.set("kneeRehabChecklistState", JSON.stringify({ "wall-setup": true }));
  staleHarness.storage.set("kneeRehabLastUpdated", "2026-10-28T20:00:00+07:00");

  vm.runInContext(`
    setupCalendar();
    applySelectedDateSession();
  `, staleHarness.context);

  assert.equal(
    staleHarness.elements.get("wall-setup").checked,
    false,
    "stale legacy localStorage from a previous day must not bleed into today"
  );

  const sameDayLegacyHarness = createTestHarness("2026-10-29T10:30:00+07:00");
  sameDayLegacyHarness.storage.set("kneeRehabChecklistState", JSON.stringify({ "wall-setup": true }));
  sameDayLegacyHarness.storage.set("kneeRehabLastUpdated", "2026-10-29T08:15:00+07:00");

  vm.runInContext(`
    setupCalendar();
    applySelectedDateSession();
  `, sameDayLegacyHarness.context);

  assert.equal(
    sameDayLegacyHarness.elements.get("wall-setup").checked,
    true,
    "same-day legacy localStorage should still be preserved when sessionHistory is empty"
  );
}

// 3. Supabase sync on a new day should clear stale localStorage when today has no remote row yet
{
  const harness = createTestHarness("2026-10-29T09:00:00+07:00");
  harness.storage.set("kneeRehabChecklistState", JSON.stringify({ "wall-setup": true }));
  harness.storage.set("kneeRehabLastUpdated", "2026-10-28T22:00:00+07:00");

  vm.runInContext(`
    setupCalendar();
    applySupabaseRows([
      {
        date_key: "2026-10-28",
        completed: true,
        manual_completion: true,
        updated_at: "2026-10-28T22:00:00+07:00",
        checklist: { "wall-setup": true },
        set_rows: {},
        exercises: {},
        monitoring: {},
        notes: "Synced yesterday"
      }
    ]);
  `, harness.context);

  assert.equal(
    harness.elements.get("wall-setup").checked,
    false,
    "Supabase sync without a row for today must leave today's checklist empty"
  );
  assert.equal(
    harness.elements.get("last-updated").textContent,
    "Not started yet",
    "Supabase sync without a row for today must show Not started yet"
  );
}

// 4. Leaving the browser tab open across midnight should automatically roll over to the new day
{
  const harness = createTestHarness("2026-10-28T21:30:00+07:00");
  const { context, elements } = harness;

  vm.runInContext(`
    setupCalendar();
    restoreChecklist();
    setupChecklistListeners();
    setupNotes();
    setupSetRows();
    applySelectedDateSession();
    setupMobileSessionMode();
    if (typeof setupDayRollover === "function") {
      setupDayRollover();
    }
  `, context);

  // User completes items on Oct 28
  elements.get("wall-setup").checked = true;
  elements.get("wall-setup").dispatchEvent("change");
  elements.get("session-notes").value = "Late night rehab";
  elements.get("session-notes").dispatchEvent("input");
  vm.runInContext(`
    setRowDone("quad-set-1", true);
    mobileSessionState.currentIndex = MOBILE_SESSION_STEPS.length;
  `, context);

  assert.equal(elements.get("completed-count").textContent, "1");

  // Clock crosses midnight to Oct 29 and user returns to the open tab
  harness.setNow("2026-10-29T08:00:00+07:00");
  harness.triggerDocumentEvent("visibilitychange");

  assert.equal(
    vm.runInContext(`calendarState.selectedDateKey`, context),
    "2026-10-29",
    "open tab should roll selectedDateKey forward to the new day on visibilitychange"
  );
  assert.equal(elements.get("wall-setup").checked, false, "rollover should clear yesterday's checked items from today's view");
  assert.equal(elements.get("completed-count").textContent, "0", "rollover should reset completed count to 0");
  assert.equal(elements.get("session-notes").value, "", "rollover should clear yesterday's notes from today's view");
  assert.equal(elements.get("last-updated").textContent, "Not started yet", "rollover should reset last-updated to Not started yet");
  assert.equal(
    vm.runInContext(`getSetRowState("quad-set-1").isDone`, context),
    false,
    "rollover should reset set rows for the new day"
  );
  assert.equal(
    vm.runInContext(`mobileSessionState.currentIndex`, context),
    0,
    "rollover should reset mobile step index to the first exercise"
  );
  assert.equal(
    vm.runInContext(`calendarState.sessionHistory["2026-10-28"].checklist["wall-setup"]`, context),
    true,
    "yesterday's saved checklist must remain preserved in sessionHistory after rollover"
  );
  assert.equal(
    vm.runInContext(`calendarState.sessionHistory["2026-10-28"].notes`, context),
    "Late night rehab",
    "yesterday's notes must remain preserved in sessionHistory after rollover"
  );
}

// 5. Same-day refresh preserves today's in-progress checklist, sets, and notes
{
  const firstLoad = createTestHarness("2026-10-29T10:00:00+07:00");
  vm.runInContext(`
    setupCalendar();
    restoreChecklist();
    setupChecklistListeners();
    setupNotes();
    setupSetRows();
    applySelectedDateSession();
  `, firstLoad.context);

  firstLoad.elements.get("quad-set-vmo").checked = true;
  firstLoad.elements.get("quad-set-vmo").dispatchEvent("change");
  firstLoad.elements.get("session-notes").value = "Today morning note";
  firstLoad.elements.get("session-notes").dispatchEvent("input");

  // Simulate refreshing later the same day using the same persisted storage
  const secondLoad = createTestHarness("2026-10-29T15:00:00+07:00");
  firstLoad.storage.forEach((value, key) => secondLoad.storage.set(key, value));

  vm.runInContext(`
    setupCalendar();
    restoreChecklist();
    setupChecklistListeners();
    setupNotes();
    setupSetRows();
    applySelectedDateSession();
  `, secondLoad.context);

  assert.equal(secondLoad.elements.get("quad-set-vmo").checked, true, "same-day refresh must preserve today's checked item");
  assert.equal(secondLoad.elements.get("session-notes").value, "Today morning note", "same-day refresh must preserve today's notes");
  assert.notEqual(secondLoad.elements.get("last-updated").textContent, "Not started yet", "same-day refresh must show today's last updated timestamp");
}

// 6. Month-boundary rollover with running timer pauses yesterday's timer, saves yesterday, and advances visible month
{
  const harness = createTestHarness("2026-10-31T23:58:00+07:00");
  const { context } = harness;

  vm.runInContext(`
    setupCalendar();
    restoreChecklist();
    setupChecklistListeners();
    setupNotes();
    setupSetRows();
    applySelectedDateSession();
    setupDayRollover();
    toggleSetRowTimer("quad-set-1");
  `, context);

  assert.equal(vm.runInContext(`getSetRowState("quad-set-1").isRunning`, context), true);

  harness.setNow("2026-11-01T00:02:00+07:00");
  harness.triggerWindowEvent("focus");

  assert.equal(vm.runInContext(`calendarState.selectedDateKey`, context), "2026-11-01");
  assert.equal(vm.runInContext(`calendarState.visibleDate.getMonth()`, context), 10, "visibleDate should advance to November (month index 10)");
  assert.equal(vm.runInContext(`getSetRowState("quad-set-1").isRunning`, context), false, "new day set timer should not be running");
  assert.equal(
    vm.runInContext(`Boolean(calendarState.sessionHistory["2026-10-31"])`, context),
    true,
    "yesterday's active timer session should be saved before rolling over"
  );
}

// 7. Rollover while viewing a historical past date keeps the selected historical date intact
{
  const harness = createTestHarness("2026-10-28T23:50:00+07:00");
  const { context } = harness;

  harness.storage.set("kneeRehabSessionHistory", JSON.stringify({
    "2026-10-20": {
      dateKey: "2026-10-20",
      completed: true,
      manualCompletion: true,
      updatedAt: "2026-10-20T18:00:00+07:00",
      checklist: { "wall-setup": true },
      setRows: {},
      exercises: {},
      monitoring: {},
      notes: "Oct 20 record"
    }
  }));

  vm.runInContext(`
    setupCalendar();
    applySelectedDateSession();
    setupDayRollover();
    selectCalendarDate("2026-10-20");
  `, context);

  harness.setNow("2026-10-29T00:10:00+07:00");
  harness.triggerWindowEvent("pageshow");

  assert.equal(
    vm.runInContext(`calendarState.selectedDateKey`, context),
    "2026-10-20",
    "viewing a specific historical date should not forcibly jump away at midnight"
  );
  assert.equal(
    vm.runInContext(`calendarState.lastKnownTodayKey`, context),
    "2026-10-29",
    "lastKnownTodayKey should still update to the new day"
  );
}

