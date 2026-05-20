# Rehab Session Website Implementation Plan

> **For Hermes:** Use `subagent-driven-development` or execute task-by-task in this session. This plan is for a small static website, so no backend or build system is required.

**Goal:** Build a clean, mobile-friendly knee rehab session tracker that shows the daily rehabilitation plan, provides a tappable checklist, saves progress locally, and helps monitor safety signals after each session.

**Architecture:** Use a static single-page app with `index.html`, `styles.css`, and `script.js`. HTML holds the rehab content and accessible checklist markup. CSS handles the calm medical-style layout and mobile readability. JavaScript handles progress counting, daily session state, notes, reset behavior, and `localStorage` persistence.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, browser `localStorage`

**Infrastructure dependencies:** None. The website can be opened directly in a browser or served locally with `python3 -m http.server`.

---

## 1. Folder and files

Create the website in this folder:

```text
rehab-session-site/
├── implementation-plan.md
├── task-checklist.md
├── index.html
├── styles.css
├── script.js
└── assets/
```

Existing planning files:
- `implementation-plan.md` — this implementation plan
- `task-checklist.md` — short execution checklist

Files to create for the actual website:
- `index.html` — page structure, rehab content, checklist markup
- `styles.css` — visual design, mobile layout, accessibility styles
- `script.js` — checkbox state, progress tracking, reset, notes persistence
- `assets/` — optional future images/icons; keep empty for MVP

---

## 2. Product requirements

### Must-have MVP
- Show the daily rehabilitation plan.
- Show Wall Sit instructions and checklist.
- Show Straight Leg Raise (SLR) instructions and checklist.
- Show post-rehab monitoring checklist.
- Allow checking and unchecking each checklist item.
- Show progress as completed items out of total checklist items.
- Save checklist progress in the browser with `localStorage`.
- Provide a reset button with confirmation.
- Work well on a phone screen.

### Should-have improvements
- Show today’s date/session label.
- Save a notes field for pain, swelling, stiffness, or observations.
- Highlight completed sections.
- Use clear safety/warning styling for sharp pain, swelling, stiffness, clicking, or grating reminders.

### Out of scope for version 1
- User login.
- Cloud sync.
- Database.
- Medical diagnosis or automated medical advice.
- Calendar history across many days. This can be added later.

---

## 3. Content to include

### Daily Rehabilitation Plan
Intro:
> Perform these exercises daily from today until your next physical therapy session.

Exercise summary cards:

1. **Wall Sit (Shallow Angle)**
   - Volume / Dosage: Hold 30 sec × 10 reps, Total: 2 Sets
   - Recommended Timing: After returning to dorm / Before bed
   - Primary Focus: Maintain a 50:50 weight distribution between both legs.

2. **Straight Leg Raise (SLR)**
   - Volume / Dosage: Hold 5 sec × 15 reps, Total: 3 Sets
   - Recommended Timing: While relaxing / Watching basketball highlights
   - Primary Focus: Turn toes out 15° to activate the inner thigh muscle (**VMO**).

### Wall Sit checklist
- Setup: Upper back and hips are flat against the wall. No leaning or shifting hip weight to one side.
- Angle: Slide down to a shallow angle (**30°–45° only**). Do **not** go down to a 90° deep squat. Keep knees behind your toes.
- Foot Position: Feet are hip-width apart, or slightly wider, with toes pointed slightly outward (15°).
- Data Check: Mindfully press the foot of your injured leg firmly into the floor. Do not let your healthy leg steal the workload.
- Safety Check: Throughout the 30-second hold, you must feel the burn only in the thigh muscles. There should be **no sharp pain inside the joint** and **no clicking/grating sounds**.

### Straight Leg Raise checklist
- Setup: Lie flat on your back on the bed. Bend the knee of your healthy leg to stabilize your lower back.
- Lock & Twist: Fully lock the knee of your injured leg straight until the kneecap floats. Then rotate your entire foot outward by 15°.
- Tempo — Lift: Lift the leg up slowly while counting 1-2-3, about 1 foot / 30 cm off the bed.
- Tempo — Hold: Squeeze and hold firmly at the top for 5 seconds.
- Tempo — Lower: Lower the leg down slowly while counting 3-2-1. Do not let the leg drop loosely.
- Data Check: Feel a distinct contraction/burn in the inner thigh muscle (VMO), located just above the inner side of your kneecap.

### Post-Rehab Monitoring checklist
- Immediately after finishing, the knee joint feels stable and has no increased throbbing or sharp pain.
- Next morning check: The knee is not swollen, tight, or stiff.
- Walking on flat ground feels smooth and pain-free.

---

## 4. UX and visual design

### Layout
- Mobile-first single-column layout.
- Header at top with title, subtitle, today’s date, and progress.
- Cards for each exercise and monitoring section.
- Footer controls for reset and notes.

### Visual tone
- Calm, medical, clean.
- Use soft background colors, rounded cards, and readable spacing.
- Avoid clutter during exercise.

### Suggested colors
- Background: `#f5f7fb`
- Main text: `#172033`
- Muted text: `#64748b`
- Primary blue: `#2563eb`
- Success green: `#16a34a`
- Warning orange/red: `#f97316`
- Card background: `#ffffff`

### Accessibility requirements
- Every checkbox must have a `<label for="...">`.
- Checkbox tap targets should be large enough for phone use.
- Text contrast must be readable.
- Buttons need visible focus states.
- Do not rely on color alone; include text labels.

---

## 5. Data model for JavaScript

Use stable checkbox IDs:

```js
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
```

Use localStorage keys:
- `kneeRehabChecklistState` — JSON object mapping checkbox IDs to booleans
- `kneeRehabNotes` — notes textarea value
- `kneeRehabLastUpdated` — ISO timestamp of last checklist change

Expected progress:
- Total checklist items: `14`
- Display format: `Progress: 0 / 14 completed`

---

## 6. Implementation tasks

### Task 1: Create website base files

**Objective:** Create the minimum website shell and verify it opens.

**Files:**
- Create: `rehab-session-site/index.html`
- Create: `rehab-session-site/styles.css`
- Create: `rehab-session-site/script.js`
- Create: `rehab-session-site/assets/`

**Steps:**
- [ ] Create `index.html` with HTML5 doctype, language, charset, viewport, title, and links to CSS/JS.
- [ ] Create empty `styles.css`.
- [ ] Create empty `script.js`.
- [ ] Create `assets/` folder.
- [ ] Verify by opening `index.html` or running:

```bash
cd rehab-session-site
python3 -m http.server 8000
```

Expected: Browser can load `http://localhost:8000/` without errors.

---

### Task 2: Build semantic HTML structure

**Objective:** Add the major sections before filling detailed content.

**Files:**
- Modify: `rehab-session-site/index.html`

**Steps:**
- [ ] Add `<header>` with title `Knee Rehab Session Tracker`.
- [ ] Add today/session metadata area.
- [ ] Add `<main>` with sections:
  - [ ] Daily Rehabilitation Plan
  - [ ] Wall Sit checklist
  - [ ] Straight Leg Raise checklist
  - [ ] Post-Rehab Monitoring
  - [ ] Notes
- [ ] Add footer/control area with reset button.
- [ ] Verify the browser shows all section headings in the correct order.

---

### Task 3: Add daily plan cards

**Objective:** Add the exercise summary content exactly and clearly.

**Files:**
- Modify: `rehab-session-site/index.html`

**Steps:**
- [ ] Add intro sentence under Daily Rehabilitation Plan.
- [ ] Add Wall Sit card with dosage, timing, and focus.
- [ ] Add SLR card with dosage, timing, and focus.
- [ ] Use semantic lists or definition lists for readability.
- [ ] Verify all numbers match the source:
  - [ ] Wall Sit: 30 sec × 10 reps, Total: 2 Sets
  - [ ] SLR: 5 sec × 15 reps, Total: 3 Sets
  - [ ] Toe angle: 15°

---

### Task 4: Add accessible checklist markup

**Objective:** Add all 14 checklist items with stable IDs.

**Files:**
- Modify: `rehab-session-site/index.html`

**Steps:**
- [ ] Add 5 Wall Sit checkbox items.
- [ ] Add 6 SLR checkbox items.
- [ ] Add 3 Post-Rehab Monitoring checkbox items.
- [ ] Use the stable IDs listed in the JavaScript data model.
- [ ] Ensure each checkbox has a matching label.
- [ ] Verify total checkbox count is 14.

---

### Task 5: Add mobile-first styling

**Objective:** Make the tracker readable and comfortable on a phone.

**Files:**
- Modify: `rehab-session-site/styles.css`

**Steps:**
- [ ] Add CSS variables for colors and spacing.
- [ ] Style body, header, main layout, cards, checklist rows, buttons, notes, and progress area.
- [ ] Make checklist rows large enough to tap easily.
- [ ] Add completed-item styling when a checkbox is checked.
- [ ] Add warning styling for safety text.
- [ ] Add responsive styles for screens wider than 700px.
- [ ] Verify no horizontal scrolling on mobile width.

---

### Task 6: Implement progress tracking

**Objective:** Count checked items and update progress immediately.

**Files:**
- Modify: `rehab-session-site/index.html`
- Modify: `rehab-session-site/script.js`

**Steps:**
- [ ] Add progress elements in HTML:
  - [ ] completed count
  - [ ] total count
  - [ ] progress bar
- [ ] In JavaScript, select all checklist checkboxes.
- [ ] Add change listeners to update progress.
- [ ] Update completed-item CSS class on each row.
- [ ] Verify progress changes when checking/unchecking items.

---

### Task 7: Implement localStorage persistence

**Objective:** Keep progress and notes after refresh.

**Files:**
- Modify: `rehab-session-site/script.js`

**Steps:**
- [ ] Save checkbox state to `kneeRehabChecklistState` on every change.
- [ ] Restore checkbox state when the page loads.
- [ ] Save notes to `kneeRehabNotes` when edited.
- [ ] Restore notes when the page loads.
- [ ] Save last updated timestamp to `kneeRehabLastUpdated`.
- [ ] Verify refresh preserves checked items and notes.

---

### Task 8: Implement reset behavior

**Objective:** Let the user safely clear a session.

**Files:**
- Modify: `rehab-session-site/index.html`
- Modify: `rehab-session-site/script.js`

**Steps:**
- [ ] Add `Reset Checklist` button.
- [ ] On click, show a confirmation prompt.
- [ ] If confirmed, uncheck all checkboxes.
- [ ] Clear checklist state from localStorage.
- [ ] Keep notes unless the user confirms clearing notes too, or add a separate `Clear Notes` button.
- [ ] Verify reset updates progress back to `0 / 14 completed`.

---

### Task 9: Add final safety and usability polish

**Objective:** Make the tracker safe, clear, and ready for daily use.

**Files:**
- Modify: `rehab-session-site/index.html`
- Modify: `rehab-session-site/styles.css`
- Modify: `rehab-session-site/script.js`

**Steps:**
- [ ] Add a short safety reminder: stop if sharp joint pain, swelling, or clicking/grating occurs and follow the physical therapist’s guidance.
- [ ] Add visible focus styles for keyboard accessibility.
- [ ] Add `aria-live="polite"` to the progress text.
- [ ] Test on desktop browser.
- [ ] Test on phone-sized viewport.
- [ ] Proofread all rehab text.

---

## 7. Verification checklist

Before calling the website complete:

- [ ] `index.html` opens without console errors.
- [ ] All 14 checklist items are visible.
- [ ] Checking one item updates progress immediately.
- [ ] Refreshing the page preserves progress.
- [ ] Reset clears checklist progress.
- [ ] Notes save after refresh.
- [ ] Website is usable on a phone screen.
- [ ] Text matches the original rehab instructions.
- [ ] Safety warnings are visible and not hidden.

---

## 8. Free deployment plan

The website is static and can be hosted for free on either Netlify or Vercel.

Deployment files added:
- `netlify.toml` — Netlify static hosting configuration
- `vercel.json` — Vercel static hosting configuration and security headers
- `README.md` — local run and free deployment instructions

Recommended options:
1. **Netlify Drop** — easiest: drag the `rehab-session-site` folder to <https://app.netlify.com/drop>.
2. **Netlify from GitHub** — best if you want automatic redeploys after edits.
3. **Vercel from GitHub** — also good for automatic redeploys; use root directory `rehab-session-site` if this folder is inside a larger repository.

No backend, build command, or paid plan is required.

---

## 9. Future improvements

- Daily history/calendar view.
- Pain score slider from 0–10.
- Swelling/stiffness dropdown.
- Export notes to `.txt` or `.json`.
- Dark mode.
- Print-friendly rehab sheet.
- Optional Thai translation.
