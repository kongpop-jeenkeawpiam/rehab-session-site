# Rehab Session Website Task Checklist

This checklist is the short execution version of `implementation-plan.md`.

## Preparation status
- [x] Create folder: `rehab-session-site/`
- [x] Save implementation plan: `implementation-plan.md`
- [x] Save task checklist: `task-checklist.md`

---

## Task 1: Create website base files
- [x] Create `index.html`
- [x] Create `styles.css`
- [x] Create `script.js`
- [x] Create `assets/` folder
- [x] Link `styles.css` and `script.js` in `index.html`
- [x] Verify the page opens through a local static server

## Task 2: Build semantic HTML structure
- [x] Add page title: `Knee Rehab Session Tracker`
- [x] Add subtitle: `Daily home rehabilitation plan and safety checklist`
- [x] Add today/session date area
- [x] Add Daily Rehabilitation Plan section
- [x] Add Wall Sit checklist section
- [x] Add Straight Leg Raise checklist section
- [x] Add Post-Rehab Monitoring section
- [x] Add Notes section
- [x] Add footer/control area

## Task 3: Add daily rehab plan content
- [x] Add intro text: “Perform these exercises daily from today until your next physical therapy session.”
- [x] Add Wall Sit dosage: Hold 30 sec × 10 reps, Total: 2 Sets
- [x] Add Wall Sit timing: After returning to dorm / Before bed
- [x] Add Wall Sit focus: 50:50 weight distribution between both legs
- [x] Add SLR dosage: Hold 5 sec × 15 reps, Total: 3 Sets
- [x] Add SLR timing: While relaxing / Watching basketball highlights
- [x] Add SLR focus: toes out 15° to activate VMO
- [x] Verify all numbers and terms match the source plan

## Task 4: Add accessible checklist items
- [x] Add Wall Sit checkbox: Setup
- [x] Add Wall Sit checkbox: Angle
- [x] Add Wall Sit checkbox: Foot Position
- [x] Add Wall Sit checkbox: Data Check
- [x] Add Wall Sit checkbox: Safety Check
- [x] Add SLR checkbox: Setup
- [x] Add SLR checkbox: Lock & Twist
- [x] Add SLR checkbox: Tempo — Lift
- [x] Add SLR checkbox: Tempo — Hold
- [x] Add SLR checkbox: Tempo — Lower
- [x] Add SLR checkbox: Data Check
- [x] Add Monitoring checkbox: Immediate stability/no increased pain
- [x] Add Monitoring checkbox: Next morning no swelling/tightness/stiffness
- [x] Add Monitoring checkbox: Walking feels smooth and pain-free
- [x] Verify total checklist count is 14
- [x] Verify each checkbox has a matching label

## Task 5: Style the website
- [x] Add CSS variables for colors and spacing
- [x] Style body and page background
- [x] Style header and date/progress area
- [x] Style exercise summary cards
- [x] Style checklist cards
- [x] Style checkbox rows for easy phone tapping
- [x] Style completed checklist items
- [x] Style safety/warning text
- [x] Style notes textarea
- [x] Style reset/clear buttons
- [x] Add responsive layout for wider screens
- [x] Verify no horizontal scrolling risk by using mobile-first layout and responsive width rules

## Task 6: Add progress tracking
- [x] Add progress text, for example `Progress: 0 / 14 completed`
- [x] Add progress bar element
- [x] Count all checklist checkboxes in JavaScript
- [x] Update progress when any checkbox changes
- [x] Add/remove completed styling when items are checked/unchecked
- [x] Add `aria-live="polite"` to progress text
- [x] Verify progress target is `14 / 14 completed` when all items are checked

## Task 7: Save checklist and notes with localStorage
- [x] Use stable checkbox IDs:
  - [x] `wall-setup`
  - [x] `wall-angle`
  - [x] `wall-foot-position`
  - [x] `wall-data-check`
  - [x] `wall-safety-check`
  - [x] `slr-setup`
  - [x] `slr-lock-twist`
  - [x] `slr-tempo-lift`
  - [x] `slr-tempo-hold`
  - [x] `slr-tempo-lower`
  - [x] `slr-data-check`
  - [x] `monitor-immediate`
  - [x] `monitor-next-morning`
  - [x] `monitor-walking`
- [x] Save checkbox state to `kneeRehabChecklistState`
- [x] Restore checkbox state on page load
- [x] Save notes to `kneeRehabNotes`
- [x] Restore notes on page load
- [x] Save last update time to `kneeRehabLastUpdated`
- [x] Verify localStorage keys are present in `script.js`

## Task 8: Add reset behavior
- [x] Add `Reset Checklist` button
- [x] Ask for confirmation before clearing progress
- [x] Clear all checkbox states after confirmation
- [x] Remove saved checklist state from localStorage
- [x] Keep notes after checklist reset
- [x] Add a separate `Clear Notes` button
- [x] Reset updates progress back to `0 / 14 completed`

## Task 9: Add free deployment support
- [x] Add `netlify.toml`
- [x] Add `vercel.json`
- [x] Add `README.md` with free Netlify and Vercel deployment instructions
- [x] Add deployment section to `implementation-plan.md`
- [x] Verify `vercel.json` is valid JSON

## Task 10: Final safety and usability polish
- [x] Add safety reminder about sharp joint pain, swelling, clicking, or grating
- [x] Add visible keyboard focus states
- [x] Proofread all rehab text against the plan
- [x] Test local static server response with `curl`
- [x] Verify all 14 checklist items are present in HTML
- [x] Verify all checkbox labels are present in HTML
- [x] Verify required localStorage keys are present in JavaScript
- [ ] Check browser console for errors — blocked in this environment because the browser tool and Node runtime are unavailable (`node: command not found`)

---

## MVP completion criteria
- [x] One-page website exists in `rehab-session-site/`
- [x] Daily rehab plan section is complete
- [x] Wall Sit checklist is complete
- [x] SLR checklist is complete
- [x] Post-rehab monitoring checklist is complete
- [x] Progress counter code exists
- [x] localStorage save/restore code exists
- [x] Reset button code exists
- [x] Notes field code exists
- [x] Mobile layout is designed for comfortable phone use
- [x] Safety reminders are visible
- [x] Free deployment files/instructions exist for Netlify and Vercel
