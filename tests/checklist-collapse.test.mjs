import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

const expectedChecklists = [
  ["wall-checklist", "wall-checklist-toggle"],
  ["slr-checklist", "slr-checklist-toggle"],
  ["bridge-checklist", "bridge-checklist-toggle"],
  ["clam-checklist", "clam-checklist-toggle"],
  ["monitoring-checklist", "monitoring-checklist-toggle"]
];

expectedChecklists.forEach(([checklistId, toggleId]) => {
  assert.match(
    html,
    new RegExp(`id="${toggleId}"[^>]*class="checklist-toggle"[^>]*aria-expanded="true"[^>]*aria-controls="${checklistId}"`),
    `${toggleId} should control ${checklistId}`
  );

  assert.match(
    html,
    new RegExp(`id="${checklistId}"[^>]*class="checklist"`),
    `${checklistId} should be a checklist container`
  );
});

assert.match(
  script,
  /checklistCollapse: "kneeRehabChecklistCollapseState"/,
  "script should define a storage key for checklist collapse state"
);

assert.match(
  script,
  /const setupChecklistCollapse = \(\) =>/,
  "script should define setupChecklistCollapse"
);

assert.match(
  script,
  /setupChecklistCollapse\(\);/,
  "DOMContentLoaded setup should initialize checklist collapse controls"
);

assert.match(
  styles,
  /\.checklist\[hidden\]\s*\{[^}]*display:\s*none;[^}]*\}/s,
  "hidden checklist containers should be forced to display none"
);

class MockElement {
  constructor(id, attributes = {}) {
    this.id = id;
    this.attributes = { id: id, ...attributes };
    this.hidden = false;
    this.textContent = "Hide Checklist";
    this.listeners = {};
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(eventName, listener) {
    this.listeners[eventName] = listener;
  }

  click() {
    this.listeners.click?.();
  }
}

const storage = new Map();
const elements = new Map();
const toggles = expectedChecklists.map(([checklistId, toggleId]) => {
  const toggle = new MockElement(toggleId, {
    class: "checklist-toggle",
    "aria-controls": checklistId,
    "aria-expanded": "true"
  });
  const checklist = new MockElement(checklistId, { class: "checklist" });

  elements.set(toggleId, toggle);
  elements.set(checklistId, checklist);

  return toggle;
});

const context = {
  console: console,
  Date: Date,
  Intl: Intl,
  JSON: JSON,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  toggles: toggles,
  elements: elements,
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    addEventListener: () => {},
    querySelectorAll: (selector) => selector === ".checklist-toggle[aria-controls]" ? toggles : [],
    getElementById: (id) => elements.get(id) ?? null
  },
  window: {}
};

vm.runInNewContext(`${script}
setupChecklistCollapse();
toggles[0].click();
assert.equal(elements.get("wall-checklist").hidden, true, "click should hide the controlled checklist");
assert.equal(toggles[0].textContent, "Show Checklist", "collapsed toggle should offer to show the checklist");
assert.equal(toggles[0].getAttribute("aria-expanded"), "false", "collapsed toggle should mark content as not expanded");

const savedCollapseState = JSON.parse(localStorage.getItem(STORAGE_KEYS.checklistCollapse));
assert.equal(savedCollapseState["wall-checklist"], true, "collapsed state should persist by checklist id");

toggles[0].click();
assert.equal(elements.get("wall-checklist").hidden, false, "second click should reveal the controlled checklist");
assert.equal(toggles[0].textContent, "Hide Checklist", "expanded toggle should offer to hide the checklist");
assert.equal(toggles[0].getAttribute("aria-expanded"), "true", "expanded toggle should mark content as expanded");
`, { ...context, assert: assert });
