import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

assert.match(
  html,
  /id="language-switcher"[^>]*aria-label="Language selection"/,
  "hero should include an accessible language switcher"
);

assert.match(
  html,
  /data-language-option="en"/,
  "language switcher should include an English option"
);

assert.match(
  html,
  /data-language-option="th"/,
  "language switcher should include a Thai option"
);

assert.match(
  script,
  /language: "kneeRehabLanguage"/,
  "script should persist the selected language"
);

assert.match(
  script,
  /const setupLanguageSwitcher = \(\) =>/,
  "script should define setupLanguageSwitcher"
);

assert.match(html, /id="assessment-save"/, "assessment submit button should have a stable translation ID");
assert.match(html, /id="daily-log-save"/, "daily log submit button should have a stable translation ID");
assert.doesNotMatch(script, /selector: "#assessment-form button"/, "assessment translation selector should not target a generic form button");
assert.doesNotMatch(script, /selector: "#daily-log-form button"/, "daily log translation selector should not target a generic form button");
assert.match(script, /#phase-1-foundation \.phase-number/, "phase one number should be translated by selector");
assert.match(script, /#phase-2-static-load h3/, "phase two title should be translated by selector");
assert.match(script, /#phase-3-dynamic-control p/, "phase three goal should be translated by selector");
assert.match(script, /t\("schedule\.dayLabel"/, "generated schedule day labels should use translations");
assert.match(script, /SCHEDULE_FOCUS_KEYS/, "generated schedule focus text should use translation keys");
assert.match(script, /t\("safety\.missingPain"/, "missing pain safety text should use translations");

class MockElement {
  constructor(id, attributes = {}) {
    this.id = id;
    this.attributes = { id: id, ...attributes };
    this.dataset = {};
    this.textContent = "";
    this.placeholder = "";
    this.value = "";
    this.listeners = {};
    this.classList = {
      classes: new Set(),
      toggle: (className, force) => {
        if (force) {
          this.classList.classes.add(className);
        } else {
          this.classList.classes.delete(className);
        }
      },
      contains: (className) => this.classList.classes.has(className)
    };
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
const titleElement = new MockElement("site-title");
titleElement.dataset.i18n = "site.title";

const notes = new MockElement("session-notes");
notes.dataset.i18nPlaceholder = "notes.placeholder";

const status = new MockElement("voice-cues-status");
const thaiButton = new MockElement("language-th");
thaiButton.dataset.languageOption = "th";
const englishButton = new MockElement("language-en");
englishButton.dataset.languageOption = "en";

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
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    title: "",
    documentElement: new MockElement("html"),
    addEventListener: () => {},
    querySelectorAll: (selector) => {
      if (selector === "[data-i18n]") return [titleElement];
      if (selector === "[data-i18n-placeholder]") return [notes];
      if (selector === "[data-i18n-aria-label]") return [];
      if (selector === "[data-language-option]") return [englishButton, thaiButton];
      return [];
    },
    getElementById: (id) => {
      if (id === "voice-cues-status") return status;
      return null;
    }
  },
  window: {
    matchMedia: () => ({ matches: false }),
    navigator: { language: "en-US" }
  }
};

vm.runInNewContext(`${script}
setupLanguageSwitcher();
setLanguage("th");
assert.equal(document.documentElement.getAttribute("lang"), "th", "Thai mode should set the document language");
assert.equal(titleElement.textContent, "ตัวติดตามการฟื้นฟูเข่า", "Thai mode should translate static text");
assert.equal(notes.placeholder, "ตัวอย่าง: รู้สึกเมื่อยกล้ามเนื้อต้นขาเล็กน้อยเท่านั้น ไม่มีอาการปวดข้อ เข่ารู้สึกปกติในเช้าวันถัดไป", "Thai mode should translate placeholders");
assert.equal(status.textContent, "เปิดเสียงเตือน", "Thai mode should translate dynamic status text");
assert.equal(localStorage.getItem(STORAGE_KEYS.language), "th", "Thai selection should persist");
assert.equal(thaiButton.getAttribute("aria-pressed"), "true", "Thai button should be selected");

englishButton.click();
assert.equal(document.documentElement.getAttribute("lang"), "en", "English click should restore the document language");
assert.equal(titleElement.textContent, "Knee Rehab Session Tracker", "English click should translate static text back");
assert.equal(status.textContent, "Voice cues on", "English click should translate dynamic status text back");
assert.equal(localStorage.getItem(STORAGE_KEYS.language), "en", "English selection should persist");
`, { ...context, assert: assert, titleElement: titleElement, notes: notes, status: status, englishButton: englishButton, thaiButton: thaiButton });
