const checklistItems = [
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

const STORAGE_KEYS = {
  checklist: "kneeRehabChecklistState",
  notes: "kneeRehabNotes",
  lastUpdated: "kneeRehabLastUpdated",
  sets: "kneeRehabSetRowState",
  completedDates: "kneeRehabCompletedDates",
  sessionHistory: "kneeRehabSessionHistory",
  voiceCuesEnabled: "kneeRehabVoiceCuesEnabled",
  checklistCollapse: "kneeRehabChecklistCollapseState",
  language: "kneeRehabLanguage",
  assessment: "kneeRehabAssessment",
  weeklySchedule: "kneeRehabWeeklySchedule",
  dailyLogs: "kneeRehabDailyLogs",
  safetyEvents: "kneeRehabSafetyEvents",
  profileLastUpdated: "kneeRehabProfileLastUpdated"
};

const SUPABASE_TABLE = "rehab_sessions";
const SUPABASE_PROFILE_TABLE = "rehab_profiles";
const SUPABASE_PLACEHOLDER_VALUES = new Set([
  "",
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY",
  "https://YOUR_PROJECT_REF.supabase.co"
]);

const SUPPORTED_LANGUAGES = ["en", "th"];
const DEFAULT_LANGUAGE = "en";

const REHAB_PHASES = [
  {
    id: "phase-1-foundation",
    number: 1,
    titleKey: "phase.one.title",
    goalKey: "phase.one.goal",
    restKey: "phase.one.rest"
  },
  {
    id: "phase-2-static-load",
    number: 2,
    titleKey: "phase.two.title",
    goalKey: "phase.two.goal",
    restKey: "phase.two.rest"
  },
  {
    id: "phase-3-dynamic-control",
    number: 3,
    titleKey: "phase.three.title",
    goalKey: "phase.three.goal",
    restKey: "phase.three.rest"
  }
];

const REHAB_EXERCISES = [
  { id: "quad-set", phaseId: "phase-1-foundation", setIds: ["quad-set-1", "quad-set-2", "quad-set-3"], target: "3 sets", checkIds: ["quad-set-setup", "quad-set-vmo", "quad-set-safety"] },
  { id: "slr", phaseId: "phase-1-foundation", setIds: ["slr-1", "slr-2", "slr-3"], target: "3 sets", checkIds: ["slr-setup", "slr-lock-twist", "slr-tempo-lift", "slr-tempo-hold", "slr-tempo-lower", "slr-data-check"] },
  { id: "bridge", phaseId: "phase-1-foundation", setIds: ["bridge-1", "bridge-2", "bridge-3"], target: "3 sets", checkIds: ["bridge-setup", "bridge-core", "bridge-lift", "bridge-safety-check"] },
  { id: "clam", phaseId: "phase-1-foundation", setIds: ["clam-1", "clam-2", "clam-3"], target: "3 sets", checkIds: ["clam-setup", "clam-hip-stack", "clam-control", "clam-safety-check"] },
  { id: "side-leg-lift", phaseId: "phase-1-foundation", setIds: ["side-leg-lift-1", "side-leg-lift-2", "side-leg-lift-3"], target: "3 sets", checkIds: ["side-leg-lift-setup", "side-leg-lift-control", "side-leg-lift-safety"] },
  { id: "wall", phaseId: "phase-2-static-load", setIds: ["wall-1", "wall-2"], target: "2 sets, 5 reps, 20 seconds", checkIds: ["wall-setup", "wall-angle", "wall-foot-position", "wall-data-check", "wall-safety-check"] },
  { id: "chair-squat", phaseId: "phase-3-dynamic-control", setIds: ["chair-squat-1"], target: "1 set, 10 reps", checkIds: ["chair-squat-support", "chair-squat-hip-hinge", "chair-squat-safety"] },
  { id: "mini-single-leg-squat", phaseId: "phase-3-dynamic-control", setIds: ["mini-single-leg-squat-1", "mini-single-leg-squat-2"], target: "1-2 sets, 5-10 reps", checkIds: ["mini-single-leg-squat-support", "mini-single-leg-squat-depth", "mini-single-leg-squat-safety"] }
];

const PROGRESSION_RULES = {
  maxPainForProgression: 3,
  maxPainIncrease: 2,
  requiredStableSessions: 3,
  sharpPainBlocksProgression: true,
  swellingBlocksProgression: true
};

let currentLanguage = DEFAULT_LANGUAGE;

const syncState = {
  client: null,
  user: null,
  isConfigured: false,
  isApplyingRemote: false
};

const translations = {
  en: {
    "meta.description": "Daily knee home rehabilitation session tracker with exercise checklist, progress, safety checks, and notes.",
    "site.title": "Knee Rehab Session Tracker",
    "site.eyebrow": "Home Rehabilitation",
    "site.subtitle": "Daily home rehabilitation plan and safety checklist",
    "language.selection": "Language selection",
    "session.summary": "Session summary",
    "session.today": "Selected session",
    "session.loadingDate": "Loading date...",
    "session.lastUpdated": "Last updated",
    "session.notStartedYet": "Not started yet",
    "voice.groupLabel": "Voice cue settings",
    "voice.toggle": "Voice Cues",
    "voice.on": "Voice cues on",
    "voice.off": "Voice cues off",
    "progress.heading": "Progress",
    "progress.text": "Progress: <span id=\"completed-count\">{completed}</span> / <span id=\"total-count\">{total}</span> completed",
    "exercise.progressHeading": "Exercise Progress",
    "exercise.progressMeta": "Sets and technique checks",
    "exercise.quad-set": "Quad Set",
    "exercise.wall": "Wall Sit",
    "exercise.slr": "Straight Leg Raise",
    "exercise.bridge": "Glute Bridges",
    "exercise.clam": "Clamshells",
    "exercise.side-leg-lift": "Side Lying Leg Lift",
    "exercise.chair-squat": "Chair Squat",
    "exercise.mini-single-leg-squat": "Mini Single Leg Squat with Support",
    "progress.sets": "<span id=\"{id}-progress-sets\">{value}</span> sets",
    "progress.checks": "<span id=\"{id}-progress-checks\">{value}</span> checks",
    "status.finished": "Finished",
    "status.inProgress": "In progress",
    "status.notStarted": "Not started",
    "status.noDetail": "No detail",
    "mobile.heading": "Knee Rehab",
    "mobile.more": "More",
    "mobile.less": "Less",
    "mobile.previous": "Previous",
    "mobile.next": "Next",
    "mobile.exercisePosition": "Exercise {current} of {total}",
    "mobile.monitoring": "Final safety check",
    "mobile.complete": "Session complete",
    "mobile.progress": "{completed} / {total} completed",
    "calendar.meta": "Completion calendar",
    "calendar.heading": "Monthly Progress",
    "calendar.navLabel": "Calendar month navigation",
    "calendar.previous": "Previous month",
    "calendar.next": "Next month",
    "calendar.loading": "Loading...",
    "calendar.weekdays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "calendar.markToday": "Mark Today Complete",
    "calendar.todayCompleted": "Today Completed",
    "calendar.selectedDay": "Selected day",
    "calendar.selectDate": "Select a date",
    "calendar.markComplete": "Mark Complete",
    "calendar.unmarkComplete": "Unmark Complete",
    "calendar.completedAria": ", completed",
    "plan.heading": "Three-Phase Rehab Plan",
    "plan.description": "Progress from zero-load activation to supported dynamic control only when safety checks stay stable.",
    "phase.one.number": "Phase 1",
    "phase.one.title": "Neuromuscular Activation and Zero-Load Foundation",
    "phase.one.goal": "Switch on the muscles without placing compressive force on the knee joint surface.",
    "phase.one.rest": "Rest 1 minute between exercises.",
    "phase.one.exercises": "Quad Set, Straight Leg Raise, Glute Bridges, Clamshell, Side Lying Leg Lift",
    "phase.two.number": "Phase 2",
    "phase.two.title": "Static Weight-Bearing",
    "phase.two.goal": "Safely tune and align the VMO vertically with wall support.",
    "phase.two.rest": "Rest 1 minute between sets.",
    "phase.two.exercises": "Wall Sit, 2 sets, 5 reps, 20 seconds",
    "phase.three.number": "Phase 3",
    "phase.three.title": "Dynamic Vertical Load Control",
    "phase.three.goal": "Practice supported real-world movement with shallow range and strict control.",
    "phase.three.rest": "Always hold onto stable support for balance.",
    "phase.three.exercises": "Chair Squat and Mini Single Leg Squat with Support",
    "assessment.meta": "Assessment",
    "assessment.heading": "Recovery Setup",
    "assessment.description": "Use these answers to generate a conservative weekly progression.",
    "assessment.statusNotSaved": "Not saved",
    "assessment.statusSaved": "Saved",
    "assessment.painLevel": "Current knee pain, 0-10",
    "assessment.injuryHistory": "Knee injury history",
    "assessment.commitmentDays": "Days per week you can commit",
    "assessment.supportAvailable": "I have stable support available for standing exercises.",
    "assessment.save": "Save setup",
    "schedule.meta": "Weekly schedule",
    "schedule.heading": "Generated Progression",
    "schedule.empty": "Save your recovery setup to generate a schedule.",
    "schedule.dayLabel": "Day {number}",
    "schedule.phaseLabel": "Phase {number}",
    "schedule.focus.foundation": "Foundation activation",
    "schedule.focus.static": "Static wall support",
    "schedule.focus.dynamic": "Supported dynamic control",
    "dailyLog.heading": "Daily Completion Log",
    "dailyLog.description": "Record symptoms before marking a session complete.",
    "dailyLog.painBefore": "Pain before session, 0-10",
    "dailyLog.painAfter": "Pain after session, 0-10",
    "dailyLog.swellingStatus": "Swelling or next-morning stiffness",
    "dailyLog.swelling.none": "None",
    "dailyLog.swelling.mild": "Mild",
    "dailyLog.swelling.increased": "Increased",
    "dailyLog.sharpPain": "Sharp joint pain occurred during Phase 2 or Phase 3.",
    "dailyLog.phaseCompleted": "Highest phase completed today",
    "dailyLog.phaseOption.one": "Phase 1",
    "dailyLog.phaseOption.two": "Phase 2",
    "dailyLog.phaseOption.three": "Phase 3",
    "dailyLog.save": "Save daily log",
    "safety.missingPain": "Enter pain before and after the session to evaluate safety.",
    "safety.sharpPain": "Stop Phase 2 and Phase 3 work today. Return to Phase 1 only and contact your physical therapist if sharp pain repeats.",
    "safety.swelling": "Do not progress this week. Use Phase 1 only until swelling and stiffness return to baseline.",
    "safety.painLimit": "Keep the next session at the same or lower phase. Pain should stay at 3/10 or below and should not rise by more than 2 points.",
    "safety.alertStable": "Safety checks are stable. Continue with the generated schedule.",
    "summary.volume": "Volume / Dosage",
    "summary.timing": "Recommended Timing",
    "summary.focus": "Primary Focus",
    "summary.wall.title": "1. Wall Sit <span>(Shallow Angle)</span>",
    "summary.wall.volume": "Hold 20 sec × 5 reps <br><strong>Total: 2 Sets</strong>",
    "summary.wall.timing": "After returning to dorm / Before bed",
    "summary.wall.focus": "Maintain a 50:50 weight distribution between both legs.",
    "summary.slr.title": "2. Straight Leg Raise <span>(SLR)</span>",
    "summary.slr.volume": "Hold 5 sec × 15 reps <br><strong>Total: 3 Sets</strong>",
    "summary.slr.timing": "While relaxing / Watching basketball highlights",
    "summary.slr.focus": "Turn toes out 15° to activate the inner thigh muscle (<strong>VMO</strong>).",
    "summary.bridge.title": "3. Glute Bridges",
    "summary.bridge.volume": "15 reps <br><strong>Total: 2 Sets</strong>",
    "summary.bridge.timing": "After Wall Sit or before bed",
    "summary.bridge.focus": "Squeeze glutes to lift the hips without arching the lower back.",
    "summary.clam.title": "4. Clamshells",
    "summary.clam.volume": "15 reps per side <br><strong>Total: 2 Sets</strong>",
    "summary.clam.timing": "After Glute Bridges or while relaxing",
    "summary.clam.focus": "Keep hips stacked and move from the outside hip without rolling backward.",
    "section.quad-set.title": "Exercise 1: Quad Set",
    "section.quad-set.subtitle": "VMO activation without joint load",
    "section.wall.title": "Exercise 6: Wall Sit",
    "section.wall.subtitle": "Joint protection and balance tuning",
    "section.slr.title": "Exercise 2: Straight Leg Raise",
    "section.slr.subtitle": "Knee lock and VMO activation",
    "section.bridge.title": "Exercise 3: Glute Bridges",
    "section.bridge.subtitle": "Hip drive and glute activation",
    "section.clam.title": "Exercise 4: Clamshells",
    "section.clam.subtitle": "Outer hip control and knee alignment",
    "section.side-leg-lift.title": "Exercise 5: Side Lying Leg Lift",
    "section.side-leg-lift.subtitle": "Hip abductor control with a quiet trunk",
    "section.chair-squat.title": "Exercise 7: Chair Squat",
    "section.chair-squat.subtitle": "Supported hip hinge and shallow knee bend",
    "section.mini-single-leg-squat.title": "Exercise 8: Mini Single Leg Squat with Support",
    "section.mini-single-leg-squat.subtitle": "Shallow single-leg control with stable support",
    "section.monitoring.title": "Post-Rehab Monitoring",
    "section.monitoring.subtitle": "Delayed response check",
    "checklist.hide": "Hide Checklist",
    "checklist.show": "Show Checklist",
    "sets.quad-set": "Quad Set Sets",
    "sets.wall": "Wall Sit Sets",
    "sets.slr": "Straight Leg Raise Sets",
    "sets.bridge": "Glute Bridge Sets",
    "sets.clam": "Clamshell Sets",
    "sets.side-leg-lift": "Side Lying Leg Lift Sets",
    "sets.chair-squat": "Chair Squat Sets",
    "sets.mini-single-leg-squat": "Mini Single Leg Squat Sets",
    "sets.count": "<span id=\"{id}-set-count\">{count}</span> / <span id=\"{id}-set-total\">{total}</span> sets",
    "sets.reset": "Reset Sets",
    "set.label": "Set {number}",
    "set.startLabel": "Start {exercise} set {number}",
    "set.pauseLabel": "Pause {exercise} set {number}",
    "set.done": "Done",
    "set.doneAria": "{exercise} set {number} done",
    "set.reps": "{count} reps",
    "set.repsPerSide": "{count} reps per side",
    "set.repsDone": "{count} reps done",
    "set.activeRep": "Rep {current}/{total}",
    "set.activeHoldRep": "HOLD! - Rep {current}/{total}",
    "set.resting": "{cue}...",
    "cue.hold": "Hold",
    "cue.resting": "Resting",
    "cue.relax": "Relax",
    "cue.lift": "Lift",
    "cue.open": "Open",
    "cue.setComplete": "Set complete",
    "check.quadSet.setup": "<strong>Setup:</strong> Sit or lie with the injured leg straight and supported.",
    "check.quadSet.vmo": "<strong>VMO:</strong> Tighten the thigh and gently push the knee down until the inner thigh switches on.",
    "check.quadSet.safety": "<strong>Safety Check:</strong> Keep the kneecap tracking straight and stop if joint pain appears.",
    "check.wall.setup": "<strong>Setup:</strong> Upper back and hips are flat against the wall. No leaning or shifting hip weight to one side.",
    "check.wall.angle": "<strong>Angle:</strong> Slide down to a shallow angle (<strong>30°-45° only</strong>). Do <strong>not</strong> go down to a 90° deep squat. Keep knees behind your toes.",
    "check.wall.foot": "<strong>Foot Position:</strong> Feet are hip-width apart, or slightly wider, with toes pointed slightly outward (15°).",
    "check.wall.data": "<strong>Data Check:</strong> Mindfully press the foot of your injured leg firmly into the floor. Do not let your healthy leg steal the workload.",
    "check.wall.safety": "<strong>Safety Check:</strong> During each 20-second hold, feel the burn only in the thigh muscles. There should be <strong>no sharp pain inside the joint</strong> and <strong>no clicking/grating sounds</strong>.",
    "check.slr.setup": "<strong>Setup:</strong> Lie flat on your back on the bed. Bend the knee of your healthy leg to stabilize your lower back.",
    "check.slr.lock": "<strong>Lock &amp; Twist:</strong> Fully lock the knee of your injured leg straight until the kneecap floats. Then rotate your entire foot outward by 15°.",
    "check.slr.lift": "<strong>Tempo - Lift:</strong> Lift the leg up slowly while counting 1-2-3, about 1 foot / 30 cm off the bed.",
    "check.slr.hold": "<strong>Tempo - Hold:</strong> Squeeze and hold firmly at the top for 5 seconds.",
    "check.slr.lower": "<strong>Tempo - Lower:</strong> Lower the leg down slowly while counting 3-2-1. Do not let the leg drop loosely.",
    "check.slr.data": "<strong>Data Check:</strong> Feel a distinct contraction/burn in the inner thigh muscle (VMO), located just above the inner side of your kneecap.",
    "check.bridge.setup": "<strong>Setup:</strong> Lie on your back with knees bent, feet flat, and feet hip-width apart.",
    "check.bridge.core": "<strong>Core:</strong> Lightly brace your abdomen so the lower back does not arch as you lift.",
    "check.bridge.lift": "<strong>Lift:</strong> Press through both heels and squeeze your glutes until hips line up with shoulders and knees.",
    "check.bridge.safety": "<strong>Safety Check:</strong> Stop if you feel sharp knee pain, hamstring cramping that does not settle, or low-back pinching.",
    "check.clam.setup": "<strong>Setup:</strong> Lie on your side with knees bent, feet together, and hips stacked.",
    "check.clam.stack": "<strong>Hip Stack:</strong> Keep your pelvis still and avoid rolling your top hip backward.",
    "check.clam.control": "<strong>Control:</strong> Lift the top knee slowly, pause briefly, then lower with control while feet stay together.",
    "check.clam.safety": "<strong>Safety Check:</strong> Stop if the knee twists, pinches, or feels unstable during the movement.",
    "check.sideLegLift.setup": "<strong>Setup:</strong> Lie on your side with the bottom knee bent and the top leg straight.",
    "check.sideLegLift.control": "<strong>Control:</strong> Lift the top leg slowly without rolling the hips backward.",
    "check.sideLegLift.safety": "<strong>Safety Check:</strong> Stop if the knee twists, pinches, or feels unstable.",
    "check.chairSquat.support": "<strong>Support:</strong> Stand in front of a chair and keep stable support within reach.",
    "check.chairSquat.hipHinge": "<strong>Hip Hinge:</strong> Sit the hips back toward the chair while keeping knees aligned over toes.",
    "check.chairSquat.safety": "<strong>Safety Check:</strong> Use a shallow range and stop if sharp joint pain appears.",
    "check.miniSingleLegSquat.support": "<strong>Support:</strong> Hold stable support and shift weight onto the working leg.",
    "check.miniSingleLegSquat.depth": "<strong>Depth:</strong> Bend only a small amount while the knee stays aligned over the toes.",
    "check.miniSingleLegSquat.safety": "<strong>Safety Check:</strong> Stop if the knee caves inward, clicks painfully, or feels unstable.",
    "monitoring.reminder": "Stop and follow your physical therapist's guidance if you notice sharp joint pain, increased swelling, or clicking/grating during the session.",
    "check.monitor.immediate": "<strong>Immediately after finishing:</strong> The knee joint feels stable and has no increased throbbing or sharp pain.",
    "check.monitor.morning": "<strong>Next Morning Check:</strong> The knee is not swollen, tight, or stiff.",
    "check.monitor.walking": "<strong>Walking Check:</strong> Normal walking on flat ground feels smooth and pain-free.",
    "notes.heading": "Session Notes",
    "notes.description": "Optional notes about pain, swelling, stiffness, or anything to tell your PT.",
    "notes.label": "Notes",
    "notes.placeholder": "Example: Mild thigh burn only, no joint pain. Knee felt normal next morning.",
    "notes.clear": "Clear Notes",
    "notes.clearConfirm": "Clear session notes? Your checklist progress will stay saved.",
    "todaySummary.heading": "Session Summary",
    "todaySummary.pending": "Your summary will appear after you mark this session complete.",
    "todaySummary.completed": "On {date}, you completed {exercises}.",
    "todaySummary.completedLegacy": "On {date}, you completed your session without detailed exercise data.",
    "todaySummary.exerciseSets": "{exercise} ({completed} of {total} sets)",
    "todaySummary.exerciseSetsWithReps": "{exercise} ({completed} of {total} sets, {completedReps} of {totalReps} reps)",
    "todaySummary.exerciseSetsWithRepsAndDuration": "{exercise} ({completed} of {total} sets, {completedReps} of {totalReps} reps, {seconds} seconds per rep)",
    "todaySummary.copy": "Copy to Clipboard",
    "todaySummary.copied": "Copied",
    "todaySummary.copyFailed": "Could not copy summary",
    "todaySummary.joinTwo": "{first} and {second}",
    "todaySummary.joinMany": "{items}, and {last}",
    "footer.resetChecklist": "Reset Checklist",
    "footer.resetAllSets": "Reset all sets",
    "footer.note": "This tracker is for following your given rehab plan. It does not replace medical advice.",
    "reset.checklistConfirm": "Reset all checklist items? Your notes will be kept.",
    "reset.exerciseSetsConfirm": "Reset {exercise} set rows? Your checklist and notes will stay saved.",
    "reset.allSetsConfirm": "Reset all exercise set rows? Your checklist and notes will stay saved.",
    "history.heading": "Session History",
    "history.selectDate": "Select a date to see saved progress.",
    "history.completedNoDetail": "Completed, no detailed session saved.",
    "history.noSession": "No session recorded.",
    "history.completed": "Completed",
    "history.notCompleted": "Not completed",
    "history.updated": "Updated {date}",
    "history.noUpdate": "No update time saved",
    "history.details": "{setsCompleted} / {setsTotal} sets, {checksCompleted} / {checksTotal} checks",
    "history.noDetailSaved": "No detail saved",
    "history.monitoring": "Monitoring: {completed} / {total} complete",
    "history.immediate": "Immediate",
    "history.nextMorning": "Next morning",
    "history.walking": "Walking",
    "history.done": "Done",
    "history.notDone": "Not done",
    "history.noNotes": "No notes saved.",
    "sync.meta": "Cloud sync",
    "sync.heading": "Supabase Sync",
    "sync.description": "Sign in with email and password to access your progress anywhere.",
    "sync.email": "Email",
    "sync.password": "Password",
    "sync.signIn": "Sign in",
    "sync.signUp": "Create account",
    "sync.signOut": "Sign out",
    "sync.statusDisabled": "Local only",
    "sync.statusSignedOut": "Sign in to sync",
    "sync.statusSignedIn": "Synced",
    "sync.statusLoading": "Loading cloud data...",
    "sync.statusSaving": "Saving...",
    "sync.statusSaved": "Saved",
    "sync.statusCheckEmail": "Check your email",
    "sync.statusError": "Sync error",
    "sync.configMissing": "Add your Supabase URL and anon key in index.html to enable cloud sync.",
    "sync.user": "Signed in as {email}",
    "sync.credentialsRequired": "Enter your email and password."
  },
  th: {
    "meta.description": "ตัวติดตามการฟื้นฟูเข่าที่บ้านรายวัน พร้อมรายการตรวจสอบการออกกำลังกาย ความคืบหน้า การตรวจความปลอดภัย และบันทึก",
    "site.title": "ตัวติดตามการฟื้นฟูเข่า",
    "site.eyebrow": "การฟื้นฟูที่บ้าน",
    "site.subtitle": "แผนฟื้นฟูที่บ้านรายวันและรายการตรวจสอบความปลอดภัย",
    "language.selection": "เลือกภาษา",
    "session.summary": "สรุปเซสชัน",
    "session.today": "เซสชันที่เลือก",
    "session.loadingDate": "กำลังโหลดวันที่...",
    "session.lastUpdated": "อัปเดตล่าสุด",
    "session.notStartedYet": "ยังไม่ได้เริ่ม",
    "voice.groupLabel": "การตั้งค่าเสียงเตือน",
    "voice.toggle": "เสียงเตือน",
    "voice.on": "เปิดเสียงเตือน",
    "voice.off": "ปิดเสียงเตือน",
    "progress.heading": "ความคืบหน้า",
    "progress.text": "ความคืบหน้า: <span id=\"completed-count\">{completed}</span> / <span id=\"total-count\">{total}</span> เสร็จแล้ว",
    "exercise.progressHeading": "ความคืบหน้าการออกกำลังกาย",
    "exercise.progressMeta": "เซ็ตและการตรวจเทคนิค",
    "exercise.quad-set": "Quad Set",
    "exercise.wall": "Wall Sit",
    "exercise.slr": "Straight Leg Raise",
    "exercise.bridge": "Glute Bridges",
    "exercise.clam": "Clamshells",
    "exercise.side-leg-lift": "Side Lying Leg Lift",
    "exercise.chair-squat": "Chair Squat",
    "exercise.mini-single-leg-squat": "Mini Single Leg Squat แบบมีที่พยุง",
    "progress.sets": "<span id=\"{id}-progress-sets\">{value}</span> เซ็ต",
    "progress.checks": "<span id=\"{id}-progress-checks\">{value}</span> รายการตรวจ",
    "status.finished": "เสร็จแล้ว",
    "status.inProgress": "กำลังทำ",
    "status.notStarted": "ยังไม่ได้เริ่ม",
    "status.noDetail": "ไม่มีรายละเอียด",
    "mobile.heading": "กายภาพเข่า",
    "mobile.more": "เพิ่มเติม",
    "mobile.less": "ย่อ",
    "mobile.previous": "ก่อนหน้า",
    "mobile.next": "ถัดไป",
    "mobile.exercisePosition": "ท่าที่ {current} จาก {total}",
    "mobile.monitoring": "ตรวจความปลอดภัยขั้นสุดท้าย",
    "mobile.complete": "เสร็จสิ้นเซสชัน",
    "mobile.progress": "เสร็จแล้ว {completed} / {total}",
    "calendar.meta": "ปฏิทินการทำครบ",
    "calendar.heading": "ความคืบหน้ารายเดือน",
    "calendar.navLabel": "นำทางเดือนในปฏิทิน",
    "calendar.previous": "เดือนก่อนหน้า",
    "calendar.next": "เดือนถัดไป",
    "calendar.loading": "กำลังโหลด...",
    "calendar.weekdays": ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
    "calendar.markToday": "ทำเครื่องหมายว่าวันนี้เสร็จแล้ว",
    "calendar.todayCompleted": "วันนี้เสร็จแล้ว",
    "calendar.selectedDay": "วันที่เลือก",
    "calendar.selectDate": "เลือกวันที่",
    "calendar.markComplete": "ทำเครื่องหมายว่าเสร็จแล้ว",
    "calendar.unmarkComplete": "ยกเลิกเครื่องหมายเสร็จแล้ว",
    "calendar.completedAria": ", เสร็จแล้ว",
    "plan.heading": "แผนฟื้นฟู 3 ระยะ",
    "plan.description": "ค่อย ๆ เพิ่มจากการกระตุ้นแบบไม่ลงน้ำหนักไปสู่การเคลื่อนไหวแบบมีที่พยุง เมื่อการตรวจความปลอดภัยยังคงปกติ",
    "phase.one.number": "ระยะที่ 1",
    "phase.one.title": "ระยะที่ 1: กระตุ้นกล้ามเนื้อแบบไม่ลงน้ำหนัก",
    "phase.one.goal": "กระตุ้นกล้ามเนื้อโดยไม่เพิ่มแรงกดบนผิวข้อเข่า",
    "phase.one.rest": "พัก 1 นาทีระหว่างท่า",
    "phase.one.exercises": "Quad Set, Straight Leg Raise, Glute Bridges, Clamshell, Side Lying Leg Lift",
    "phase.two.number": "ระยะที่ 2",
    "phase.two.title": "ระยะที่ 2: ลงน้ำหนักคงที่",
    "phase.two.goal": "ฝึกแนวเข่าและ VMO อย่างระมัดระวังโดยใช้ผนังช่วยพยุง",
    "phase.two.rest": "พัก 1 นาทีระหว่างเซ็ต",
    "phase.two.exercises": "Wall Sit, 2 เซ็ต เซ็ตละ 5 ครั้ง ค้างครั้งละ 20 วินาที",
    "phase.three.number": "ระยะที่ 3",
    "phase.three.title": "ระยะที่ 3: ควบคุมแรงลงน้ำหนักขณะเคลื่อนไหว",
    "phase.three.goal": "ฝึกการเคลื่อนไหวจริงแบบมีที่พยุง ช่วงสั้น และควบคุมเข้มงวด",
    "phase.three.rest": "จับที่พยุงที่มั่นคงไว้เสมอเพื่อช่วยทรงตัว",
    "phase.three.exercises": "Chair Squat และ Mini Single Leg Squat แบบมีที่พยุง",
    "assessment.meta": "การประเมิน",
    "assessment.heading": "ตั้งค่าการฟื้นฟู",
    "assessment.description": "ใช้คำตอบเหล่านี้เพื่อสร้างแผนความก้าวหน้ารายสัปดาห์แบบระมัดระวัง",
    "assessment.statusNotSaved": "ยังไม่ได้บันทึก",
    "assessment.statusSaved": "บันทึกแล้ว",
    "assessment.painLevel": "ระดับปวดเข่าปัจจุบัน 0-10",
    "assessment.injuryHistory": "ประวัติอาการหรือการบาดเจ็บที่เข่า",
    "assessment.commitmentDays": "จำนวนวันที่ทำได้ต่อสัปดาห์",
    "assessment.supportAvailable": "มีที่พยุงมั่นคงสำหรับท่ายืน",
    "assessment.save": "บันทึกการตั้งค่า",
    "schedule.meta": "ตารางรายสัปดาห์",
    "schedule.heading": "แผนความก้าวหน้าที่สร้าง",
    "schedule.empty": "บันทึกการตั้งค่าการฟื้นฟูก่อนเพื่อสร้างตาราง",
    "schedule.dayLabel": "วันที่ {number}",
    "schedule.phaseLabel": "ระยะที่ {number}",
    "schedule.focus.foundation": "กระตุ้นพื้นฐาน",
    "schedule.focus.static": "พยุงกับผนังแบบคงที่",
    "schedule.focus.dynamic": "ควบคุมการเคลื่อนไหวแบบมีที่พยุง",
    "dailyLog.heading": "บันทึกการทำประจำวัน",
    "dailyLog.description": "บันทึกอาการก่อนทำเครื่องหมายว่าเซสชันเสร็จ",
    "dailyLog.painBefore": "ปวดก่อนเริ่ม 0-10",
    "dailyLog.painAfter": "ปวดหลังทำ 0-10",
    "dailyLog.swellingStatus": "บวมหรือตึงในเช้าวันถัดไป",
    "dailyLog.swelling.none": "ไม่มี",
    "dailyLog.swelling.mild": "เล็กน้อย",
    "dailyLog.swelling.increased": "เพิ่มขึ้น",
    "dailyLog.sharpPain": "มีอาการปวดแปลบในข้อระหว่างระยะที่ 2 หรือ 3",
    "dailyLog.phaseCompleted": "ระยะสูงสุดที่ทำวันนี้",
    "dailyLog.phaseOption.one": "ระยะที่ 1",
    "dailyLog.phaseOption.two": "ระยะที่ 2",
    "dailyLog.phaseOption.three": "ระยะที่ 3",
    "dailyLog.save": "บันทึกประจำวัน",
    "safety.missingPain": "กรอกระดับปวดก่อนและหลังทำเพื่อประเมินความปลอดภัย",
    "safety.sharpPain": "หยุดงานระยะที่ 2 และ 3 วันนี้ กลับไปทำเฉพาะระยะที่ 1 และติดต่อผู้ดูแลหากอาการปวดแปลบเกิดซ้ำ",
    "safety.swelling": "อย่าเพิ่มระดับในสัปดาห์นี้ ใช้เฉพาะระยะที่ 1 จนกว่าอาการบวมและตึงกลับสู่ระดับเดิม",
    "safety.painLimit": "เซสชันถัดไปให้คงระยะเดิมหรือลดลง ระดับปวดควรอยู่ไม่เกิน 3/10 และไม่เพิ่มเกิน 2 คะแนน",
    "safety.alertStable": "การตรวจความปลอดภัยยังคงปกติ ทำตามตารางที่สร้างไว้ต่อได้",
    "summary.volume": "ปริมาณ / จำนวนครั้ง",
    "summary.timing": "เวลาที่แนะนำ",
    "summary.focus": "จุดเน้นหลัก",
    "summary.wall.title": "1. Wall Sit <span>(มุมตื้น)</span>",
    "summary.wall.volume": "ค้าง 20 วินาที × 5 ครั้ง <br><strong>รวม: 2 เซ็ต</strong>",
    "summary.wall.timing": "หลังกลับถึงหอพัก / ก่อนนอน",
    "summary.wall.focus": "รักษาการลงน้ำหนัก 50:50 ระหว่างขาทั้งสองข้าง",
    "summary.slr.title": "2. Straight Leg Raise <span>(SLR)</span>",
    "summary.slr.volume": "ค้าง 5 วินาที × 15 ครั้ง <br><strong>รวม: 3 เซ็ต</strong>",
    "summary.slr.timing": "ระหว่างพักผ่อน / ตอนดูไฮไลต์บาสเกตบอล",
    "summary.slr.focus": "หมุนปลายเท้าออก 15° เพื่อกระตุ้นกล้ามเนื้อต้นขาด้านใน (<strong>VMO</strong>)",
    "summary.bridge.title": "3. Glute Bridges",
    "summary.bridge.volume": "15 ครั้ง <br><strong>รวม: 2 เซ็ต</strong>",
    "summary.bridge.timing": "หลัง Wall Sit หรือก่อนนอน",
    "summary.bridge.focus": "บีบกล้ามเนื้อก้นเพื่อยกสะโพก โดยไม่แอ่นหลังส่วนล่าง",
    "summary.clam.title": "4. Clamshells",
    "summary.clam.volume": "ข้างละ 15 ครั้ง <br><strong>รวม: 2 เซ็ต</strong>",
    "summary.clam.timing": "หลัง Glute Bridges หรือระหว่างพักผ่อน",
    "summary.clam.focus": "ให้สะโพกซ้อนกันและขยับจากสะโพกด้านนอก โดยไม่กลิ้งตัวไปด้านหลัง",
    "section.quad-set.title": "ท่าที่ 1: Quad Set",
    "section.quad-set.subtitle": "กระตุ้น VMO โดยไม่ลงน้ำหนักข้อ",
    "section.wall.title": "ท่าที่ 6: Wall Sit",
    "section.wall.subtitle": "ปกป้องข้อและปรับสมดุล",
    "section.slr.title": "ท่าที่ 2: Straight Leg Raise",
    "section.slr.subtitle": "ล็อกเข่าและกระตุ้น VMO",
    "section.bridge.title": "ท่าที่ 3: Glute Bridges",
    "section.bridge.subtitle": "แรงขับจากสะโพกและการกระตุ้นกล้ามเนื้อก้น",
    "section.clam.title": "ท่าที่ 4: Clamshells",
    "section.clam.subtitle": "ควบคุมสะโพกด้านนอกและแนวเข่า",
    "section.side-leg-lift.title": "ท่าที่ 5: Side Lying Leg Lift",
    "section.side-leg-lift.subtitle": "ควบคุมสะโพกด้านข้างโดยไม่กลิ้งลำตัว",
    "section.chair-squat.title": "ท่าที่ 7: Chair Squat",
    "section.chair-squat.subtitle": "ฝึกพับสะโพกและงอเข่าตื้นแบบมีที่พยุง",
    "section.mini-single-leg-squat.title": "ท่าที่ 8: Mini Single Leg Squat แบบมีที่พยุง",
    "section.mini-single-leg-squat.subtitle": "ควบคุมขาข้างเดียวช่วงตื้นพร้อมที่พยุง",
    "section.monitoring.title": "การติดตามหลังฟื้นฟู",
    "section.monitoring.subtitle": "ตรวจการตอบสนองภายหลัง",
    "checklist.hide": "ซ่อนรายการตรวจ",
    "checklist.show": "แสดงรายการตรวจ",
    "sets.quad-set": "เซ็ต Quad Set",
    "sets.wall": "เซ็ต Wall Sit",
    "sets.slr": "เซ็ต Straight Leg Raise",
    "sets.bridge": "เซ็ต Glute Bridge",
    "sets.clam": "เซ็ต Clamshell",
    "sets.side-leg-lift": "เซ็ต Side Lying Leg Lift",
    "sets.chair-squat": "เซ็ต Chair Squat",
    "sets.mini-single-leg-squat": "เซ็ต Mini Single Leg Squat",
    "sets.count": "<span id=\"{id}-set-count\">{count}</span> / <span id=\"{id}-set-total\">{total}</span> เซ็ต",
    "sets.reset": "รีเซ็ตเซ็ต",
    "set.label": "เซ็ต {number}",
    "set.startLabel": "เริ่ม {exercise} เซ็ต {number}",
    "set.pauseLabel": "พัก {exercise} เซ็ต {number}",
    "set.done": "เสร็จ",
    "set.doneAria": "{exercise} เซ็ต {number} เสร็จแล้ว",
    "set.reps": "{count} ครั้ง",
    "set.repsPerSide": "ข้างละ {count} ครั้ง",
    "set.repsDone": "{count} ครั้งเสร็จแล้ว",
    "set.activeRep": "ครั้งที่ {current}/{total}",
    "set.activeHoldRep": "ค้างไว้! - ครั้งที่ {current}/{total}",
    "set.resting": "{cue}...",
    "cue.hold": "ค้างไว้",
    "cue.resting": "พัก",
    "cue.relax": "ผ่อนคลาย",
    "cue.lift": "ยก",
    "cue.open": "เปิด",
    "cue.setComplete": "เซ็ตเสร็จแล้ว",
    "check.quadSet.setup": "<strong>การจัดท่า:</strong> นั่งหรือนอนโดยเหยียดขาข้างที่บาดเจ็บให้ตรงและมีที่รองรับ",
    "check.quadSet.vmo": "<strong>VMO:</strong> เกร็งต้นขาและกดเข่าลงเบา ๆ จนรู้สึกกล้ามเนื้อต้นขาด้านในทำงาน",
    "check.quadSet.safety": "<strong>ตรวจความปลอดภัย:</strong> ให้ลูกสะบ้าเคลื่อนตรง และหยุดหากมีอาการปวดในข้อ",
    "check.wall.setup": "<strong>การจัดท่า:</strong> หลังส่วนบนและสะโพกแนบผนัง ห้ามเอนตัวหรือถ่ายน้ำหนักสะโพกไปข้างใดข้างหนึ่ง",
    "check.wall.angle": "<strong>มุมเข่า:</strong> เลื่อนตัวลงเป็นมุมตื้น (<strong>เฉพาะ 30°-45°</strong>) ห้ามลงลึกถึงท่าสควอต 90° ให้เข่าอยู่หลังปลายเท้า",
    "check.wall.foot": "<strong>ตำแหน่งเท้า:</strong> วางเท้ากว้างเท่าช่วงสะโพก หรือกว้างกว่าเล็กน้อย โดยให้ปลายเท้าชี้ออกเล็กน้อย (15°)",
    "check.wall.data": "<strong>ตรวจการลงน้ำหนัก:</strong> ตั้งใจกดฝ่าเท้าข้างที่บาดเจ็บลงพื้นให้มั่นคง อย่าให้ขาข้างที่ปกติแย่งรับแรง",
    "check.wall.safety": "<strong>ตรวจความปลอดภัย:</strong> ระหว่างค้างครั้งละ 20 วินาที ควรรู้สึกเมื่อยเฉพาะกล้ามเนื้อต้นขา ต้อง<strong>ไม่มีอาการปวดแปลบในข้อ</strong> และ<strong>ไม่มีเสียงคลิก/เสียงเสียดสี</strong>",
    "check.slr.setup": "<strong>การจัดท่า:</strong> นอนหงายราบบนเตียง งอเข่าข้างที่ปกติเพื่อช่วยให้หลังส่วนล่างมั่นคง",
    "check.slr.lock": "<strong>ล็อกและหมุน:</strong> เหยียดเข่าข้างที่บาดเจ็บให้ตรงจนสุดจนลูกสะบ้าลอยขึ้น จากนั้นหมุนเท้าทั้งข้างออก 15°",
    "check.slr.lift": "<strong>จังหวะ - ยก:</strong> ยกขาขึ้นช้า ๆ พร้อมนับ 1-2-3 ให้สูงจากเตียงประมาณ 1 ฟุต / 30 ซม.",
    "check.slr.hold": "<strong>จังหวะ - ค้าง:</strong> เกร็งและค้างไว้ที่ตำแหน่งบนสุด 5 วินาที",
    "check.slr.lower": "<strong>จังหวะ - วางลง:</strong> ลดขาลงช้า ๆ พร้อมนับ 3-2-1 อย่าปล่อยขาตกลงแบบหลวม ๆ",
    "check.slr.data": "<strong>ตรวจการทำงานของกล้ามเนื้อ:</strong> รู้สึกว่ากล้ามเนื้อต้นขาด้านใน (VMO) หดตัว/เมื่อยชัดเจน บริเวณเหนือด้านในของลูกสะบ้า",
    "check.bridge.setup": "<strong>การจัดท่า:</strong> นอนหงาย งอเข่า วางเท้าราบกับพื้น และแยกเท้ากว้างเท่าช่วงสะโพก",
    "check.bridge.core": "<strong>แกนกลางลำตัว:</strong> เกร็งหน้าท้องเบา ๆ เพื่อไม่ให้หลังส่วนล่างแอ่นขณะยก",
    "check.bridge.lift": "<strong>ยก:</strong> กดผ่านส้นเท้าทั้งสองข้างและบีบกล้ามเนื้อก้นจนสะโพกอยู่ในแนวเดียวกับไหล่และเข่า",
    "check.bridge.safety": "<strong>ตรวจความปลอดภัย:</strong> หยุดหากมีอาการปวดเข่าแปลบ ตะคริวกล้ามเนื้อหลังต้นขาที่ไม่คลาย หรือรู้สึกหนีบที่หลังส่วนล่าง",
    "check.clam.setup": "<strong>การจัดท่า:</strong> นอนตะแคง งอเข่า เท้าชิดกัน และให้สะโพกซ้อนกัน",
    "check.clam.stack": "<strong>สะโพกซ้อนกัน:</strong> ให้เชิงกรานอยู่นิ่งและหลีกเลี่ยงการกลิ้งสะโพกด้านบนไปด้านหลัง",
    "check.clam.control": "<strong>การควบคุม:</strong> ยกเข่าด้านบนขึ้นช้า ๆ หยุดค้างสั้น ๆ แล้วลดลงอย่างควบคุม โดยให้เท้ายังคงชิดกัน",
    "check.clam.safety": "<strong>ตรวจความปลอดภัย:</strong> หยุดหากเข่าบิด รู้สึกหนีบ หรือรู้สึกไม่มั่นคงระหว่างเคลื่อนไหว",
    "check.sideLegLift.setup": "<strong>การจัดท่า:</strong> นอนตะแคง งอเข่าด้านล่าง และเหยียดขาด้านบนตรง",
    "check.sideLegLift.control": "<strong>การควบคุม:</strong> ยกขาด้านบนช้า ๆ โดยไม่กลิ้งสะโพกไปด้านหลัง",
    "check.sideLegLift.safety": "<strong>ตรวจความปลอดภัย:</strong> หยุดหากเข่าบิด รู้สึกหนีบ หรือไม่มั่นคง",
    "check.chairSquat.support": "<strong>ที่พยุง:</strong> ยืนหน้าก้าอี้และให้มีที่พยุงมั่นคงใกล้มือ",
    "check.chairSquat.hipHinge": "<strong>พับสะโพก:</strong> ถอยสะโพกไปหาก้าอี้โดยให้เข่าอยู่แนวเดียวกับปลายเท้า",
    "check.chairSquat.safety": "<strong>ตรวจความปลอดภัย:</strong> ใช้ช่วงการเคลื่อนไหวตื้น และหยุดหากปวดแปลบในข้อ",
    "check.miniSingleLegSquat.support": "<strong>ที่พยุง:</strong> จับที่พยุงมั่นคงและถ่ายน้ำหนักลงขาข้างที่ฝึก",
    "check.miniSingleLegSquat.depth": "<strong>ความลึก:</strong> งอเข่าเพียงเล็กน้อยโดยให้เข่าอยู่แนวเดียวกับปลายเท้า",
    "check.miniSingleLegSquat.safety": "<strong>ตรวจความปลอดภัย:</strong> หยุดหากเข่ายุบเข้าใน คลิกแบบเจ็บ หรือรู้สึกไม่มั่นคง",
    "monitoring.reminder": "หยุดและทำตามคำแนะนำของนักกายภาพบำบัด หากมีอาการปวดข้อแบบแปลบ บวมมากขึ้น หรือมีเสียงคลิก/เสียงเสียดสีระหว่างเซสชัน",
    "check.monitor.immediate": "<strong>ทันทีหลังทำเสร็จ:</strong> ข้อเข่ารู้สึกมั่นคง และไม่มีอาการตุบ ๆ หรือปวดแปลบเพิ่มขึ้น",
    "check.monitor.morning": "<strong>ตรวจเช้าวันถัดไป:</strong> เข่าไม่บวม ไม่ตึง และไม่ฝืด",
    "check.monitor.walking": "<strong>ตรวจการเดิน:</strong> การเดินปกติบนพื้นราบรู้สึกลื่นไหลและไม่เจ็บ",
    "notes.heading": "บันทึกเซสชัน",
    "notes.description": "บันทึกเพิ่มเติมเกี่ยวกับอาการปวด บวม ตึง หรือสิ่งที่ต้องแจ้งนักกายภาพบำบัด",
    "notes.label": "บันทึก",
    "notes.placeholder": "ตัวอย่าง: รู้สึกเมื่อยกล้ามเนื้อต้นขาเล็กน้อยเท่านั้น ไม่มีอาการปวดข้อ เข่ารู้สึกปกติในเช้าวันถัดไป",
    "notes.clear": "ล้างบันทึก",
    "notes.clearConfirm": "ล้างบันทึกเซสชันหรือไม่? ความคืบหน้ารายการตรวจสอบจะยังคงถูกบันทึกไว้",
    "todaySummary.heading": "สรุปเซสชัน",
    "todaySummary.pending": "สรุปจะแสดงหลังจากคุณทำเครื่องหมายว่าเซสชันนี้เสร็จแล้ว",
    "todaySummary.completed": "วันที่ {date} คุณทำ {exercises}",
    "todaySummary.completedLegacy": "วันที่ {date} คุณทำเซสชันเสร็จแล้วโดยไม่มีรายละเอียดการออกกำลังกาย",
    "todaySummary.exerciseSets": "{exercise} ({completed} จาก {total} เซ็ต)",
    "todaySummary.exerciseSetsWithReps": "{exercise} ({completed} จาก {total} เซ็ต, {completedReps} จาก {totalReps} ครั้ง)",
    "todaySummary.exerciseSetsWithRepsAndDuration": "{exercise} ({completed} จาก {total} เซ็ต, {completedReps} จาก {totalReps} ครั้ง, ค้างครั้งละ {seconds} วินาที)",
    "todaySummary.copy": "คัดลอกไปยังคลิปบอร์ด",
    "todaySummary.copied": "คัดลอกแล้ว",
    "todaySummary.copyFailed": "ไม่สามารถคัดลอกสรุปได้",
    "todaySummary.joinTwo": "{first} และ {second}",
    "todaySummary.joinMany": "{items} และ {last}",
    "footer.resetChecklist": "รีเซ็ตรายการตรวจ",
    "footer.resetAllSets": "รีเซ็ตทุกเซ็ต",
    "footer.note": "ตัวติดตามนี้มีไว้สำหรับทำตามแผนฟื้นฟูที่ได้รับ ไม่สามารถใช้แทนคำแนะนำทางการแพทย์ได้",
    "reset.checklistConfirm": "รีเซ็ตรายการตรวจทั้งหมดหรือไม่? บันทึกของคุณจะยังคงอยู่",
    "reset.exerciseSetsConfirm": "รีเซ็ตแถวเซ็ตของ {exercise} หรือไม่? รายการตรวจและบันทึกจะยังคงถูกบันทึกไว้",
    "reset.allSetsConfirm": "รีเซ็ตแถวเซ็ตการออกกำลังกายทั้งหมดหรือไม่? รายการตรวจและบันทึกจะยังคงถูกบันทึกไว้",
    "history.heading": "ประวัติเซสชัน",
    "history.selectDate": "เลือกวันที่เพื่อดูความคืบหน้าที่บันทึกไว้",
    "history.completedNoDetail": "เสร็จแล้ว แต่ไม่มีรายละเอียดเซสชันที่บันทึกไว้",
    "history.noSession": "ยังไม่มีการบันทึกเซสชัน",
    "history.completed": "เสร็จแล้ว",
    "history.notCompleted": "ยังไม่เสร็จ",
    "history.updated": "อัปเดต {date}",
    "history.noUpdate": "ไม่มีเวลาที่บันทึกไว้",
    "history.details": "{setsCompleted} / {setsTotal} เซ็ต, {checksCompleted} / {checksTotal} รายการตรวจ",
    "history.noDetailSaved": "ไม่มีรายละเอียดที่บันทึกไว้",
    "history.monitoring": "การติดตาม: {completed} / {total} เสร็จแล้ว",
    "history.immediate": "ทันทีหลังทำเสร็จ",
    "history.nextMorning": "เช้าวันถัดไป",
    "history.walking": "การเดิน",
    "history.done": "เสร็จ",
    "history.notDone": "ยังไม่เสร็จ",
    "history.noNotes": "ไม่มีบันทึกที่บันทึกไว้",
    "sync.meta": "ซิงก์คลาวด์",
    "sync.heading": "ซิงก์ Supabase",
    "sync.description": "เข้าสู่ระบบด้วยอีเมลและรหัสผ่านเพื่อเข้าถึงความคืบหน้าของคุณได้ทุกที่",
    "sync.email": "อีเมล",
    "sync.password": "รหัสผ่าน",
    "sync.signIn": "เข้าสู่ระบบ",
    "sync.signUp": "สร้างบัญชี",
    "sync.signOut": "ออกจากระบบ",
    "sync.statusDisabled": "เฉพาะเครื่องนี้",
    "sync.statusSignedOut": "เข้าสู่ระบบเพื่อซิงก์",
    "sync.statusSignedIn": "ซิงก์แล้ว",
    "sync.statusLoading": "กำลังโหลดข้อมูลคลาวด์...",
    "sync.statusSaving": "กำลังบันทึก...",
    "sync.statusSaved": "บันทึกแล้ว",
    "sync.statusCheckEmail": "ตรวจสอบอีเมลของคุณ",
    "sync.statusError": "เกิดข้อผิดพลาดในการซิงก์",
    "sync.configMissing": "เพิ่ม Supabase URL และ anon key ใน index.html เพื่อเปิดใช้การซิงก์คลาวด์",
    "sync.user": "เข้าสู่ระบบเป็น {email}",
    "sync.credentialsRequired": "กรอกอีเมลและรหัสผ่าน"
  }
};

const STATIC_TRANSLATION_SELECTORS = [
  { selector: 'meta[name="description"]', key: "meta.description", attr: "content" },
  { selector: ".eyebrow", key: "site.eyebrow" },
  { selector: ".subtitle", key: "site.subtitle" },
  { selector: "#language-switcher", key: "language.selection", attr: "aria-label" },
  { selector: "#sync-auth-panel .meta-label", key: "sync.meta" },
  { selector: "#sync-heading", key: "sync.heading" },
  { selector: "#sync-description", key: "sync.description" },
  { selector: 'label[for="sync-email"]', key: "sync.email" },
  { selector: 'label[for="sync-password"]', key: "sync.password" },
  { selector: "#sync-sign-in", key: "sync.signIn" },
  { selector: "#sync-sign-up", key: "sync.signUp" },
  { selector: "#sync-sign-out", key: "sync.signOut" },
  { selector: ".session-panel", key: "session.summary", attr: "aria-label" },
  { selector: ".session-panel > div:nth-child(1) .meta-label", key: "session.today" },
  { selector: ".session-panel > div:nth-child(2) .meta-label", key: "session.lastUpdated" },
  { selector: ".voice-cue-panel", key: "voice.groupLabel", attr: "aria-label" },
  { selector: ".voice-cue-toggle span", key: "voice.toggle" },
  { selector: "#progress-heading", key: "progress.heading" },
  { selector: "#exercise-progress-heading", key: "exercise.progressHeading" },
  { selector: ".exercise-progress-header .meta-label", key: "exercise.progressMeta" },
  { selector: '[data-exercise-progress="quad-set"] strong', key: "exercise.quad-set" },
  { selector: '[data-exercise-progress="wall"] strong', key: "exercise.wall" },
  { selector: '[data-exercise-progress="slr"] strong', key: "exercise.slr" },
  { selector: '[data-exercise-progress="bridge"] strong', key: "exercise.bridge" },
  { selector: '[data-exercise-progress="clam"] strong', key: "exercise.clam" },
  { selector: '[data-exercise-progress="side-leg-lift"] strong', key: "exercise.side-leg-lift" },
  { selector: '[data-exercise-progress="chair-squat"] strong', key: "exercise.chair-squat" },
  { selector: '[data-exercise-progress="mini-single-leg-squat"] strong', key: "exercise.mini-single-leg-squat" },
  { selector: '.calendar-card[aria-labelledby="calendar-heading"] .calendar-header .meta-label', key: "calendar.meta" },
  { selector: "#calendar-heading", key: "calendar.heading" },
  { selector: ".calendar-nav", key: "calendar.navLabel", attr: "aria-label" },
  { selector: "#calendar-prev", key: "calendar.previous", attr: "aria-label" },
  { selector: "#calendar-next", key: "calendar.next", attr: "aria-label" },
  { selector: ".selected-day-panel .meta-label", key: "calendar.selectedDay" },
  { selector: "#daily-plan-heading", key: "plan.heading" },
  { selector: "#daily-plan-heading + p", key: "plan.description" },
  { selector: "#phase-1-foundation .phase-number", key: "phase.one.number" },
  { selector: "#phase-1-foundation h3", key: "phase.one.title" },
  { selector: "#phase-1-foundation p", key: "phase.one.goal" },
  { selector: "#phase-1-foundation strong", key: "phase.one.exercises" },
  { selector: "#phase-2-static-load .phase-number", key: "phase.two.number" },
  { selector: "#phase-2-static-load h3", key: "phase.two.title" },
  { selector: "#phase-2-static-load p", key: "phase.two.goal" },
  { selector: "#phase-2-static-load strong", key: "phase.two.exercises" },
  { selector: "#phase-3-dynamic-control .phase-number", key: "phase.three.number" },
  { selector: "#phase-3-dynamic-control h3", key: "phase.three.title" },
  { selector: "#phase-3-dynamic-control p", key: "phase.three.goal" },
  { selector: "#phase-3-dynamic-control strong", key: "phase.three.exercises" },
  { selector: '.assessment-card .assessment-header .meta-label', key: "assessment.meta" },
  { selector: "#assessment-heading", key: "assessment.heading" },
  { selector: "#assessment-heading + p", key: "assessment.description" },
  { selector: 'label[for="pain-level"]', key: "assessment.painLevel" },
  { selector: 'label[for="injury-history"]', key: "assessment.injuryHistory" },
  { selector: 'label[for="commitment-days"]', key: "assessment.commitmentDays" },
  { selector: 'label[for="support-available"] span', key: "assessment.supportAvailable" },
  { selector: "#assessment-save", key: "assessment.save" },
  { selector: '#weekly-schedule-panel .calendar-header .meta-label', key: "schedule.meta" },
  { selector: "#weekly-schedule-heading", key: "schedule.heading" },
  { selector: "#daily-log-heading", key: "dailyLog.heading" },
  { selector: "#daily-log-heading + p", key: "dailyLog.description" },
  { selector: 'label[for="pain-before"]', key: "dailyLog.painBefore" },
  { selector: 'label[for="pain-after"]', key: "dailyLog.painAfter" },
  { selector: 'label[for="swelling-status"]', key: "dailyLog.swellingStatus" },
  { selector: '#swelling-status option[value="none"]', key: "dailyLog.swelling.none" },
  { selector: '#swelling-status option[value="mild"]', key: "dailyLog.swelling.mild" },
  { selector: '#swelling-status option[value="increased"]', key: "dailyLog.swelling.increased" },
  { selector: 'label[for="sharp-pain"] span', key: "dailyLog.sharpPain" },
  { selector: 'label[for="phase-completed"]', key: "dailyLog.phaseCompleted" },
  { selector: '#phase-completed option[value="1"]', key: "dailyLog.phaseOption.one" },
  { selector: '#phase-completed option[value="2"]', key: "dailyLog.phaseOption.two" },
  { selector: '#phase-completed option[value="3"]', key: "dailyLog.phaseOption.three" },
  { selector: "#daily-log-save", key: "dailyLog.save" },
  { selector: ".exercise-summary:nth-of-type(1) h3", key: "summary.wall.title", html: true },
  { selector: ".exercise-summary:nth-of-type(2) h3", key: "summary.slr.title", html: true },
  { selector: ".exercise-summary:nth-of-type(3) h3", key: "summary.bridge.title", html: true },
  { selector: ".exercise-summary:nth-of-type(4) h3", key: "summary.clam.title", html: true },
  { selector: ".exercise-summary dl > div:nth-child(1) dt", key: "summary.volume" },
  { selector: ".exercise-summary dl > div:nth-child(2) dt", key: "summary.timing" },
  { selector: ".exercise-summary dl > div:nth-child(3) dt", key: "summary.focus" },
  { selector: ".exercise-summary:nth-of-type(1) dl > div:nth-child(1) dd", key: "summary.wall.volume", html: true },
  { selector: ".exercise-summary:nth-of-type(1) dl > div:nth-child(2) dd", key: "summary.wall.timing" },
  { selector: ".exercise-summary:nth-of-type(1) dl > div:nth-child(3) dd", key: "summary.wall.focus" },
  { selector: ".exercise-summary:nth-of-type(2) dl > div:nth-child(1) dd", key: "summary.slr.volume", html: true },
  { selector: ".exercise-summary:nth-of-type(2) dl > div:nth-child(2) dd", key: "summary.slr.timing" },
  { selector: ".exercise-summary:nth-of-type(2) dl > div:nth-child(3) dd", key: "summary.slr.focus", html: true },
  { selector: ".exercise-summary:nth-of-type(3) dl > div:nth-child(1) dd", key: "summary.bridge.volume", html: true },
  { selector: ".exercise-summary:nth-of-type(3) dl > div:nth-child(2) dd", key: "summary.bridge.timing" },
  { selector: ".exercise-summary:nth-of-type(3) dl > div:nth-child(3) dd", key: "summary.bridge.focus" },
  { selector: ".exercise-summary:nth-of-type(4) dl > div:nth-child(1) dd", key: "summary.clam.volume", html: true },
  { selector: ".exercise-summary:nth-of-type(4) dl > div:nth-child(2) dd", key: "summary.clam.timing" },
  { selector: ".exercise-summary:nth-of-type(4) dl > div:nth-child(3) dd", key: "summary.clam.focus" },
  { selector: "#quad-set-heading", key: "section.quad-set.title" },
  { selector: "#quad-set-heading + p", key: "section.quad-set.subtitle" },
  { selector: "#slr-heading", key: "section.slr.title" },
  { selector: "#slr-heading + p", key: "section.slr.subtitle" },
  { selector: "#bridge-heading", key: "section.bridge.title" },
  { selector: "#bridge-heading + p", key: "section.bridge.subtitle" },
  { selector: "#clam-heading", key: "section.clam.title" },
  { selector: "#clam-heading + p", key: "section.clam.subtitle" },
  { selector: "#side-leg-lift-heading", key: "section.side-leg-lift.title" },
  { selector: "#side-leg-lift-heading + p", key: "section.side-leg-lift.subtitle" },
  { selector: "#wall-sit-heading", key: "section.wall.title" },
  { selector: "#wall-sit-heading + p", key: "section.wall.subtitle" },
  { selector: "#chair-squat-heading", key: "section.chair-squat.title" },
  { selector: "#chair-squat-heading + p", key: "section.chair-squat.subtitle" },
  { selector: "#mini-single-leg-squat-heading", key: "section.mini-single-leg-squat.title" },
  { selector: "#mini-single-leg-squat-heading + p", key: "section.mini-single-leg-squat.subtitle" },
  { selector: "#monitoring-heading", key: "section.monitoring.title" },
  { selector: "#monitoring-heading + p", key: "section.monitoring.subtitle" },
  { selector: "#quad-set-set-heading", key: "sets.quad-set" },
  { selector: "#wall-set-heading", key: "sets.wall" },
  { selector: "#slr-set-heading", key: "sets.slr" },
  { selector: "#bridge-set-heading", key: "sets.bridge" },
  { selector: "#clam-set-heading", key: "sets.clam" },
  { selector: "#side-leg-lift-set-heading", key: "sets.side-leg-lift" },
  { selector: "#chair-squat-set-heading", key: "sets.chair-squat" },
  { selector: "#mini-single-leg-squat-set-heading", key: "sets.mini-single-leg-squat" },
  { selector: '[id$="-set-reset"]', key: "sets.reset" },
  { selector: 'label[for="quad-set-setup"]', key: "check.quadSet.setup", html: true },
  { selector: 'label[for="quad-set-vmo"]', key: "check.quadSet.vmo", html: true },
  { selector: 'label[for="quad-set-safety"]', key: "check.quadSet.safety", html: true },
  { selector: 'label[for="wall-setup"]', key: "check.wall.setup", html: true },
  { selector: 'label[for="wall-angle"]', key: "check.wall.angle", html: true },
  { selector: 'label[for="wall-foot-position"]', key: "check.wall.foot", html: true },
  { selector: 'label[for="wall-data-check"]', key: "check.wall.data", html: true },
  { selector: 'label[for="wall-safety-check"]', key: "check.wall.safety", html: true },
  { selector: 'label[for="slr-setup"]', key: "check.slr.setup", html: true },
  { selector: 'label[for="slr-lock-twist"]', key: "check.slr.lock", html: true },
  { selector: 'label[for="slr-tempo-lift"]', key: "check.slr.lift", html: true },
  { selector: 'label[for="slr-tempo-hold"]', key: "check.slr.hold", html: true },
  { selector: 'label[for="slr-tempo-lower"]', key: "check.slr.lower", html: true },
  { selector: 'label[for="slr-data-check"]', key: "check.slr.data", html: true },
  { selector: 'label[for="bridge-setup"]', key: "check.bridge.setup", html: true },
  { selector: 'label[for="bridge-core"]', key: "check.bridge.core", html: true },
  { selector: 'label[for="bridge-lift"]', key: "check.bridge.lift", html: true },
  { selector: 'label[for="bridge-safety-check"]', key: "check.bridge.safety", html: true },
  { selector: 'label[for="clam-setup"]', key: "check.clam.setup", html: true },
  { selector: 'label[for="clam-hip-stack"]', key: "check.clam.stack", html: true },
  { selector: 'label[for="clam-control"]', key: "check.clam.control", html: true },
  { selector: 'label[for="clam-safety-check"]', key: "check.clam.safety", html: true },
  { selector: 'label[for="side-leg-lift-setup"]', key: "check.sideLegLift.setup", html: true },
  { selector: 'label[for="side-leg-lift-control"]', key: "check.sideLegLift.control", html: true },
  { selector: 'label[for="side-leg-lift-safety"]', key: "check.sideLegLift.safety", html: true },
  { selector: 'label[for="chair-squat-support"]', key: "check.chairSquat.support", html: true },
  { selector: 'label[for="chair-squat-hip-hinge"]', key: "check.chairSquat.hipHinge", html: true },
  { selector: 'label[for="chair-squat-safety"]', key: "check.chairSquat.safety", html: true },
  { selector: 'label[for="mini-single-leg-squat-support"]', key: "check.miniSingleLegSquat.support", html: true },
  { selector: 'label[for="mini-single-leg-squat-depth"]', key: "check.miniSingleLegSquat.depth", html: true },
  { selector: 'label[for="mini-single-leg-squat-safety"]', key: "check.miniSingleLegSquat.safety", html: true },
  { selector: ".safety-reminder", key: "monitoring.reminder" },
  { selector: 'label[for="monitor-immediate"]', key: "check.monitor.immediate", html: true },
  { selector: 'label[for="monitor-next-morning"]', key: "check.monitor.morning", html: true },
  { selector: 'label[for="monitor-walking"]', key: "check.monitor.walking", html: true },
  { selector: "#notes-heading", key: "notes.heading" },
  { selector: "#notes-heading + p", key: "notes.description" },
  { selector: ".notes-label", key: "notes.label" },
  { selector: "#todays-summary-heading", key: "todaySummary.heading" },
  { selector: "#copy-session-summary", key: "todaySummary.copy" },
  { selector: "#clear-notes", key: "notes.clear" },
  { selector: "#reset-checklist", key: "footer.resetChecklist" },
  { selector: "#reset-all-sets", key: "footer.resetAllSets" },
  { selector: ".footer-note", key: "footer.note" }
];

const isSupportedLanguage = (language) => SUPPORTED_LANGUAGES.includes(language);

const getStoredLanguage = () => {
  const storedLanguage = localStorage.getItem(STORAGE_KEYS.language);
  return isSupportedLanguage(storedLanguage) ? storedLanguage : null;
};

const getBrowserLanguagePreference = () => {
  const language = window.navigator?.language?.slice(0, 2);
  return isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
};

const getInitialLanguage = () => getStoredLanguage() || getBrowserLanguagePreference();

const getCurrentLanguage = () => currentLanguage;

const getCurrentLocale = () => currentLanguage === "th" ? "th-TH" : "en-US";

const getSupabaseConfig = () => {
  const config = window.KNEE_REHAB_SUPABASE_CONFIG || {};
  return {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || "").trim()
  };
};

const hasSupabaseConfigValue = (value) => !SUPABASE_PLACEHOLDER_VALUES.has(value);

const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  syncState.isConfigured = hasSupabaseConfigValue(config.url) && hasSupabaseConfigValue(config.anonKey);

  if (!syncState.isConfigured || !window.supabase?.createClient) return null;
  return window.supabase.createClient(config.url, config.anonKey);
};

const interpolate = (template, values = {}) => Object.entries(values)
  .reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template);

const t = (key, values = {}) => {
  const dictionary = translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
  const fallbackDictionary = translations[DEFAULT_LANGUAGE];
  const value = dictionary[key] ?? fallbackDictionary[key] ?? key;

  if (Array.isArray(value)) return value;
  return interpolate(value, values);
};

const getExerciseLabel = (exerciseId) => {
  const key = `exercise.${exerciseId}`;
  return translations[currentLanguage]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? exerciseId;
};

const getStatusKey = (status) => {
  if (status === "Finished" || status === "finished") return "status.finished";
  if (status === "In progress" || status === "in-progress") return "status.inProgress";
  if (status === "Not started" || status === "not-started") return "status.notStarted";
  return "status.noDetail";
};

const translateWithAttributes = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
};

const translateStaticSelectors = () => {
  STATIC_TRANSLATION_SELECTORS.forEach((item) => {
    document.querySelectorAll(item.selector).forEach((element) => {
      const value = t(item.key);
      if (item.attr) {
        element.setAttribute(item.attr, value);
      } else if (item.html) {
        element.innerHTML = value;
      } else {
        element.textContent = value;
      }
    });
  });
};

const translateWeekdays = () => {
  const weekdays = t("calendar.weekdays");
  document.querySelectorAll(".calendar-weekdays span").forEach((element, index) => {
    element.textContent = weekdays[index] || element.textContent;
  });
};

const translateProgressSummary = () => {
  const completed = document.getElementById("completed-count")?.textContent || "0";
  const total = document.getElementById("total-count")?.textContent || String(checklistItems.length);
  const progressText = document.getElementById("progress-text");
  if (progressText) {
    progressText.innerHTML = t("progress.text", { completed: completed, total: total });
  }

  exerciseProgressGroups.forEach((group) => {
    const sets = document.getElementById(`${group.id}-progress-sets`)?.textContent || `0 / ${group.setIds.length}`;
    const checks = document.getElementById(`${group.id}-progress-checks`)?.textContent || `0 / ${group.checkIds.length}`;
    const setsWrapper = document.getElementById(`${group.id}-progress-sets`)?.parentElement;
    const checksWrapper = document.getElementById(`${group.id}-progress-checks`)?.parentElement;

    if (setsWrapper) setsWrapper.innerHTML = t("progress.sets", { id: group.id, value: sets });
    if (checksWrapper) checksWrapper.innerHTML = t("progress.checks", { id: group.id, value: checks });
  });
};

const translateSetStaticText = () => {
  exerciseSetTrackers.forEach((tracker) => {
    const count = document.getElementById(`${tracker.id}-set-count`)?.textContent || "0";
    const total = document.getElementById(`${tracker.id}-set-total`)?.textContent || String(tracker.totalSets);
    const countWrapper = document.getElementById(`${tracker.id}-set-count`)?.parentElement;
    if (countWrapper) {
      countWrapper.innerHTML = t("sets.count", {
        id: tracker.id,
        count: count,
        total: total
      });
    }

    tracker.sets.forEach((set, index) => {
      const number = String(index + 1);
      const setNumber = getSetRowControl(set.id, "number", ".set-number");
      const doneLabel = getSetRowControl(set.id, "done", 'input[type="checkbox"]')?.closest(".set-done");
      const doneText = doneLabel?.querySelector("span");
      const doneInput = getSetRowControl(set.id, "done", 'input[type="checkbox"]');

      if (setNumber) setNumber.setAttribute("aria-label", t("set.label", { number: number }));
      if (doneText) doneText.textContent = t("set.done");
      if (doneInput) {
        doneInput.setAttribute("aria-label", t("set.doneAria", {
          exercise: getExerciseLabel(tracker.id),
          number: number
        }));
      }
    });
  });
};

const translateChecklistToggles = () => {
  document.querySelectorAll(".checklist-toggle[aria-controls]").forEach((toggle) => {
    const checklistId = toggle.getAttribute("aria-controls");
    const checklist = checklistId ? document.getElementById(checklistId) : null;
    toggle.textContent = checklist?.hidden ? t("checklist.show") : t("checklist.hide");
  });
};

const applyTranslations = () => {
  document.documentElement.setAttribute("lang", currentLanguage);
  document.title = t("site.title");
  translateWithAttributes();
  translateStaticSelectors();
  translateWeekdays();
  translateProgressSummary();
  translateSetStaticText();
  translateChecklistToggles();
};

const updateLanguageButtons = () => {
  document.querySelectorAll("[data-language-option]").forEach((button) => {
    const isSelected = button.dataset.languageOption === currentLanguage;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("is-active", isSelected);
  });
};

const refreshLocalizedDynamicText = () => {
  if (document.getElementById("session-date") && document.getElementById("last-updated")) {
    setupSessionMeta();
  }
  renderVoiceCueControl();
  if (
    document.getElementById("completed-count") &&
    document.getElementById("total-count") &&
    document.getElementById("progress-fill")
  ) {
    updateProgress();
  }
  if (document.getElementById("wall-set-count")) {
    renderSetRows();
  }
  if (document.getElementById("calendar-grid")) {
    renderCalendar();
  }
  if (document.getElementById("session-history-panel")) {
    renderSessionHistory();
  }
  if (document.getElementById("sync-auth-panel")) {
    renderSyncAuthState();
  }
  if (document.getElementById("assessment-status")) {
    renderAssessmentStatus();
  }
  if (document.getElementById("weekly-schedule-list")) {
    renderWeeklySchedule();
  }
  if (document.getElementById("safety-alert")) {
    restoreDailyLog();
  }
};

const setLanguage = (language) => {
  if (!isSupportedLanguage(language)) return;

  currentLanguage = language;
  localStorage.setItem(STORAGE_KEYS.language, language);
  applyTranslations();
  updateLanguageButtons();
  refreshLocalizedDynamicText();
};

const setupLanguageSwitcher = () => {
  currentLanguage = getInitialLanguage();
  applyTranslations();
  updateLanguageButtons();

  document.querySelectorAll("[data-language-option]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.languageOption);
    });
  });
};

const DEFAULT_COMPLETED_DATES = [
  "2026-05-19",
  "2026-05-20",
  "2026-05-21",
  "2026-05-22",
  "2026-05-23"
];

const audioCueState = {
  isEnabled: true,
  audioContext: null
};

const SET_ROW_CONFIG = {
  "quad-set": { totalReps: 10, workDurationSec: 5, restDurationSec: 5, workCue: "Squeeze", restCue: "Relax", activeTargetPrefix: "Rep" },
  slr: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Hold", restCue: "Relax", activeTargetPrefix: "HOLD! - Rep" },
  bridge: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Lift", restCue: "Relax", activeTargetPrefix: "Rep" },
  clam: { totalReps: 15, workDurationSec: 5, restDurationSec: 3, workCue: "Open", restCue: "Relax", activeTargetPrefix: "Rep" },
  "side-leg-lift": { totalReps: 15, workDurationSec: 3, restDurationSec: 3, workCue: "Lift", restCue: "Relax", activeTargetPrefix: "Rep" },
  wall: { totalReps: 5, workDurationSec: 20, restDurationSec: 60, workCue: "Hold", restCue: "Resting", activeTargetPrefix: "Rep" },
  "chair-squat": { totalReps: 10, workDurationSec: 3, restDurationSec: 3, workCue: "Lower", restCue: "Stand", activeTargetPrefix: "Rep" },
  "mini-single-leg-squat": { totalReps: 10, workDurationSec: 3, restDurationSec: 3, workCue: "Lower", restCue: "Stand", activeTargetPrefix: "Rep" }
};

const SET_ID_NUMBER_SUFFIX_PATTERN = /-\d+$/;

const getExerciseIdFromSetId = (setId) => REHAB_EXERCISES
  .find((exercise) => exercise.setIds.includes(setId))
  ?.id || setId.replace(SET_ID_NUMBER_SUFFIX_PATTERN, "");

const getSetRowConfig = (setId) => {
  const exerciseId = getExerciseIdFromSetId(setId);
  return SET_ROW_CONFIG[exerciseId] || SET_ROW_CONFIG.slr;
};

const exerciseSetTrackers = REHAB_EXERCISES.map((exercise) => ({
  id: exercise.id,
  label: exercise.id,
  totalSets: exercise.setIds.length,
  sets: exercise.setIds.map((setId) => ({ id: setId, target: exercise.target }))
}));

const exerciseProgressGroups = REHAB_EXERCISES.map((exercise) => ({
  id: exercise.id,
  label: exercise.id,
  setIds: exercise.setIds,
  checkIds: exercise.checkIds
}));

const MOBILE_SESSION_QUERY = "(max-width: 699px)";
const MOBILE_SESSION_STEPS = [
  ...REHAB_EXERCISES.map((exercise) => ({
    id: exercise.id,
    cardId: `${exercise.id}-card`,
    setIds: exercise.setIds,
    checkIds: exercise.checkIds
  })),
  {
    id: "monitoring",
    cardId: "monitoring-card",
    setIds: [],
    checkIds: ["monitor-immediate", "monitor-next-morning", "monitor-walking"]
  }
];

const mobileSessionState = {
  currentIndex: 0,
  isInitialized: false,
  mediaQuery: null
};

const findFirstIncompleteMobileStep = (completionStates) => {
  const index = completionStates.findIndex((isComplete) => !isComplete);
  return index === -1 ? completionStates.length : index;
};

const findNextIncompleteMobileStep = (completionStates, currentIndex) => {
  for (let index = currentIndex + 1; index < completionStates.length; index++) {
    if (!completionStates[index]) return index;
  }
  return completionStates.length;
};

const isMobileSessionStepComplete = (step) => {
  const setsComplete = step.setIds.every((setId) => getSetRowState(setId)?.isDone === true);
  const checksComplete = step.checkIds.every((checkId) => document.getElementById(checkId)?.checked === true);
  return setsComplete && checksComplete;
};

const getMobileSessionCompletionStates = () => MOBILE_SESSION_STEPS.map(isMobileSessionStepComplete);

const getMobileSessionStepLabel = (step, index) => {
  if (step.id === "monitoring") return t("mobile.monitoring");
  return `${index + 1}. ${getExerciseLabel(step.id)}`;
};

const getMobileSessionPositionLabel = (index) => {
  if (index >= MOBILE_SESSION_STEPS.length) return t("mobile.complete");
  if (MOBILE_SESSION_STEPS[index].id === "monitoring") return t("mobile.monitoring");
  return t("mobile.exercisePosition", { current: index + 1, total: REHAB_EXERCISES.length });
};

const renderMobileSessionStepList = (completionStates) => {
  const list = document.getElementById("mobile-session-step-list");
  if (!list) return;

  if (list.children.length !== MOBILE_SESSION_STEPS.length) {
    list.textContent = "";
    MOBILE_SESSION_STEPS.forEach((step, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-step-button";
      button.addEventListener("click", () => setMobileSessionStep(index, true));
      list.appendChild(button);
    });
  }

  MOBILE_SESSION_STEPS.forEach((step, index) => {
    const button = list.children[index];
    button.className = "mobile-step-button";
    button.textContent = getMobileSessionStepLabel(step, index);
    button.classList.toggle("completed", completionStates[index]);
    if (index === mobileSessionState.currentIndex) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
};

const renderMobileSessionMode = () => {
  if (!mobileSessionState.isInitialized) return;

  const completionStates = getMobileSessionCompletionStates();
  const allComplete = completionStates.every(Boolean);
  const currentIndex = mobileSessionState.currentIndex;
  const isCompletionView = currentIndex >= MOBILE_SESSION_STEPS.length;
  const nextIndex = findNextIncompleteMobileStep(completionStates, currentIndex);
  const checklistStats = getChecklistStats();
  const positionLabel = getMobileSessionPositionLabel(currentIndex);

  document.body.classList.toggle("mobile-session-complete", allComplete);
  MOBILE_SESSION_STEPS.forEach((step, index) => {
    document.getElementById(step.cardId)?.classList.toggle("mobile-inactive-step", index !== currentIndex);
  });

  const heading = document.getElementById("mobile-session-heading");
  const date = document.getElementById("mobile-session-date");
  const current = document.getElementById("mobile-session-current");
  const progress = document.getElementById("mobile-session-progress");
  const position = document.getElementById("mobile-session-position");
  const previous = document.getElementById("mobile-session-previous");
  const next = document.getElementById("mobile-session-next");
  const more = document.getElementById("mobile-session-more");

  if (heading) heading.textContent = t("mobile.heading");
  if (date) date.textContent = document.getElementById("session-date")?.textContent || "";
  if (current) current.textContent = positionLabel;
  if (position) position.textContent = positionLabel;
  if (progress) {
    progress.textContent = t("mobile.progress", {
      completed: checklistStats.completed,
      total: checklistStats.total
    });
  }
  if (previous) {
    previous.textContent = t("mobile.previous");
    previous.disabled = currentIndex === 0;
  }
  if (next) {
    next.textContent = t("mobile.next");
    next.disabled = isCompletionView || (!allComplete && nextIndex >= MOBILE_SESSION_STEPS.length);
  }
  if (more) {
    const isOpen = document.body.classList.contains("mobile-more-open");
    more.textContent = t(isOpen ? "mobile.less" : "mobile.more");
    more.setAttribute("aria-expanded", String(isOpen));
  }

  renderMobileSessionStepList(completionStates);
};

const setMobileSessionStep = (index, shouldScroll = false) => {
  mobileSessionState.currentIndex = Math.max(0, Math.min(index, MOBILE_SESSION_STEPS.length));
  renderMobileSessionMode();

  if (shouldScroll && mobileSessionState.mediaQuery?.matches) {
    document.getElementById("mobile-session-overview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const applyMobileSessionViewport = () => {
  const isMobile = mobileSessionState.mediaQuery?.matches === true;
  document.body.classList.toggle("mobile-session-ready", isMobile);
  if (!isMobile) document.body.classList.remove("mobile-more-open");
  renderMobileSessionMode();
};

const setupMobileSessionMode = () => {
  if (typeof window.matchMedia !== "function") return;

  mobileSessionState.mediaQuery = window.matchMedia(MOBILE_SESSION_QUERY);
  mobileSessionState.currentIndex = findFirstIncompleteMobileStep(getMobileSessionCompletionStates());
  mobileSessionState.isInitialized = true;

  document.getElementById("mobile-session-previous")?.addEventListener("click", () => {
    setMobileSessionStep(mobileSessionState.currentIndex - 1, true);
  });
  document.getElementById("mobile-session-next")?.addEventListener("click", () => {
    const completionStates = getMobileSessionCompletionStates();
    const nextIndex = findNextIncompleteMobileStep(completionStates, mobileSessionState.currentIndex);
    if (completionStates.every(Boolean)) {
      setMobileSessionStep(MOBILE_SESSION_STEPS.length, true);
    } else if (nextIndex < MOBILE_SESSION_STEPS.length) {
      setMobileSessionStep(nextIndex, true);
    }
  });
  document.getElementById("mobile-session-more")?.addEventListener("click", () => {
    document.body.classList.toggle("mobile-more-open");
    renderMobileSessionMode();
  });

  if (typeof mobileSessionState.mediaQuery.addEventListener === "function") {
    mobileSessionState.mediaQuery.addEventListener("change", applyMobileSessionViewport);
  } else {
    mobileSessionState.mediaQuery.addListener(applyMobileSessionViewport);
  }

  applyMobileSessionViewport();
};

let setRowIntervalId = null;

const today = new Date();

const calendarState = {
  visibleDate: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDateKey: null,
  completedDates: new Set(),
  sessionHistory: {}
};

const createInitialSetRowState = () => REHAB_EXERCISES.reduce((rows, exercise) => {
  exercise.setIds.forEach((setId) => {
    const config = getSetRowConfig(setId);
    rows[setId] = {
      elapsedMs: 0,
      startedAt: null,
      isRunning: false,
      isDone: false,
      isRepLoop: true,
      totalReps: config.totalReps,
      currentRep: 1,
      repState: "work",
      timeRemainingSec: config.workDurationSec,
      workDurationSec: config.workDurationSec,
      restDurationSec: config.restDurationSec
    };
  });
  return rows;
}, {});

const setRowState = createInitialSetRowState();

const formatDateTime = (value) => {
  if (!value) return t("session.notStartedYet");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("session.notStartedYet");
  return new Intl.DateTimeFormat(getCurrentLocale(), {
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
  if (!date) return t("calendar.selectDate");
  return new Intl.DateTimeFormat(getCurrentLocale(), {
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
  const statusKey = isFinished ? "status.finished" : hasStarted ? "status.inProgress" : "status.notStarted";

  return {
    completedSets: completedSets,
    completedChecks: completedChecks,
    totalSets: totalSets,
    totalChecks: totalChecks,
    statusKey: statusKey,
    status: t(statusKey),
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

const getTodayDateKey = () => formatDateKey(new Date());

const getActiveDateKey = () => calendarState.selectedDateKey || getTodayDateKey();

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

const getSetRowsSnapshot = () => {
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

  return state;
};

const applySetRowsSnapshot = (storedRows = {}) => {
  getAllSetRows().forEach((set) => {
    const storedState = storedRows[set.id];
    const startedAt = Number(storedState?.startedAt);
    const isRepLoop = true;
    const config = getSetRowConfig(set.id);
    const totalReps = config.totalReps;
    const workDurationSec = config.workDurationSec;
    const restDurationSec = config.restDurationSec;
    const dosageChanged = Number(storedState?.totalReps) !== totalReps
      || Number(storedState?.workDurationSec) !== workDurationSec
      || Number(storedState?.restDurationSec) !== restDurationSec;
    const isDone = storedState?.isDone === true;
    const storedRepState = storedState?.repState === "rest" ? "rest" : "work";
    const phaseDurationSec = storedRepState === "rest" ? restDurationSec : workDurationSec;

    setRowState[set.id].elapsedMs = normalizeElapsedMs(storedState?.elapsedMs);
    setRowState[set.id].startedAt = Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null;
    setRowState[set.id].isRunning = storedState?.isRunning === true && setRowState[set.id].startedAt !== null;
    setRowState[set.id].isDone = isDone;

    setRowState[set.id].isRepLoop = isRepLoop;
    setRowState[set.id].totalReps = totalReps;
    setRowState[set.id].currentRep = isDone
      ? totalReps
      : dosageChanged ? 1 : clampNumber(storedState?.currentRep, 1, totalReps);
    setRowState[set.id].repState = isDone ? "completed" : dosageChanged ? "work" : storedRepState;
    setRowState[set.id].timeRemainingSec = isDone
      ? 0
      : dosageChanged ? workDurationSec : clampNumber(storedState?.timeRemainingSec, 0, phaseDurationSec);
    setRowState[set.id].workDurationSec = workDurationSec;
    setRowState[set.id].restDurationSec = restDurationSec;
    setRowState[set.id].isRunning = false; // keep it paused on refresh
  });
};

const saveSetRows = () => {
  localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(getSetRowsSnapshot()));
  saveTodaySessionHistory();
};

const restoreSetRows = () => {
  applySetRowsSnapshot(readStoredSetRows());
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

const getChecklistSnapshot = () => {
  const state = {};
  getCheckboxes().forEach((checkbox) => {
    state[checkbox.id] = checkbox.checked;
  });
  return state;
};

const applyChecklistSnapshot = (state = {}) => {
  getCheckboxes().forEach((checkbox) => {
    checkbox.checked = Boolean(state[checkbox.id]);
  });
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
    label: getExerciseLabel(group.id),
    status: stats.status,
    statusKey: stats.statusKey,
    completedSets: stats.completedSets,
    totalSets: stats.totalSets,
    completedChecks: stats.completedChecks,
    totalChecks: stats.totalChecks
  };

  return exercises;
}, {});

const getStoredNotes = () => localStorage.getItem(STORAGE_KEYS.notes) || "";

const writeActiveSnapshotsToLocalStorage = () => {
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(getChecklistSnapshot()));
  localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(getSetRowsSnapshot()));
  localStorage.setItem(STORAGE_KEYS.notes, getCurrentNotes());
};

const createCurrentSessionHistoryRecord = (dateKey, options = {}) => {
  const existingRecord = calendarState.sessionHistory[dateKey] || {};
  const completed = options.completed ?? existingRecord.completed ?? calendarState.completedDates.has(dateKey);
  const manualCompletion = options.manualCompletion ?? existingRecord.manualCompletion ?? false;

  return {
    dateKey: dateKey,
    completed: Boolean(completed),
    manualCompletion: Boolean(manualCompletion),
    updatedAt: new Date().toISOString(),
    checklist: getChecklistSnapshot(),
    setRows: getSetRowsSnapshot(),
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
    checklist: existingRecord.checklist || {},
    setRows: existingRecord.setRows || {},
    exercises: existingRecord.exercises || {},
    monitoring: existingRecord.monitoring || {},
    notes: existingRecord.notes || ""
  };
};

const createLegacyTodayRecord = () => {
  const todayKey = getTodayDateKey();
  return {
    dateKey: todayKey,
    completed: calendarState.completedDates.has(todayKey),
    manualCompletion: false,
    updatedAt: localStorage.getItem(STORAGE_KEYS.lastUpdated) || new Date().toISOString(),
    checklist: readStoredChecklist(),
    setRows: readStoredSetRows(),
    exercises: {},
    monitoring: {},
    notes: getStoredNotes()
  };
};

const getSessionRecordForDate = (dateKey) => {
  const record = calendarState.sessionHistory[dateKey];
  if (record) return record;
  return dateKey === getTodayDateKey()
    ? createLegacyTodayRecord()
    : createMinimalSessionHistoryRecord(dateKey, calendarState.completedDates.has(dateKey));
};

const saveActiveSessionHistory = (options = {}) => {
  const dateKey = getActiveDateKey();
  if (!dateKey || isFutureDateKey(dateKey)) return;

  calendarState.sessionHistory[dateKey] = createCurrentSessionHistoryRecord(dateKey, options);
  writeSessionHistory();
  queueSupabaseSaveDate(dateKey);
};

const saveTodaySessionHistory = saveActiveSessionHistory;

const saveActiveSessionHistoryLocalOnly = (options = {}) => {
  const dateKey = getActiveDateKey();
  if (!dateKey || isFutureDateKey(dateKey)) return;

  calendarState.sessionHistory[dateKey] = createCurrentSessionHistoryRecord(dateKey, options);
  writeSessionHistory();
};

const saveSelectedDateCompletionHistory = (dateKey, completed) => {
  if (!dateKey) return;

  calendarState.sessionHistory[dateKey] = dateKey === getActiveDateKey()
    ? createCurrentSessionHistoryRecord(dateKey, { completed: completed, manualCompletion: true })
    : createMinimalSessionHistoryRecord(dateKey, completed);
  writeSessionHistory();
  queueSupabaseSaveDate(dateKey);
};

const canUseSupabaseSync = () => syncState.client && syncState.user && !syncState.isApplyingRemote;

const setSyncStatus = (message, statusClass = "") => {
  const status = document.getElementById("sync-status");
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("connected", statusClass === "connected");
  status.classList.toggle("error", statusClass === "error");
};

const getSyncControls = () => ({
  email: document.getElementById("sync-email"),
  password: document.getElementById("sync-password"),
  signIn: document.getElementById("sync-sign-in"),
  signUp: document.getElementById("sync-sign-up"),
  signOut: document.getElementById("sync-sign-out"),
  user: document.getElementById("sync-user")
});

const renderSyncAuthState = () => {
  const controls = getSyncControls();
  const isSignedIn = Boolean(syncState.user);
  const isAvailable = Boolean(syncState.client);

  if (controls.email) controls.email.disabled = !isAvailable || isSignedIn;
  if (controls.password) controls.password.disabled = !isAvailable || isSignedIn;
  if (controls.signIn) {
    controls.signIn.hidden = isSignedIn;
    controls.signIn.disabled = !isAvailable;
  }
  if (controls.signUp) {
    controls.signUp.hidden = isSignedIn;
    controls.signUp.disabled = !isAvailable;
  }
  if (controls.signOut) controls.signOut.hidden = !isSignedIn;

  if (controls.user) {
    controls.user.hidden = !isSignedIn;
    controls.user.textContent = isSignedIn ? t("sync.user", { email: syncState.user.email || "" }) : "";
  }

  if (!isAvailable) {
    setSyncStatus(t("sync.statusDisabled"));
    if (controls.user) {
      controls.user.hidden = false;
      controls.user.textContent = t("sync.configMissing");
    }
    return;
  }

  setSyncStatus(isSignedIn ? t("sync.statusSignedIn") : t("sync.statusSignedOut"), isSignedIn ? "connected" : "");
};

const normalizeSupabaseDateKey = (value) => {
  if (typeof value !== "string") return null;
  return value.slice(0, 10);
};

const createSupabaseRow = (dateKey) => {
  const record = getSessionRecordForDate(dateKey);
  const isActiveDate = dateKey === getActiveDateKey();

  return {
    user_id: syncState.user.id,
    date_key: dateKey,
    completed: Boolean(record.completed),
    manual_completion: Boolean(record.manualCompletion),
    checklist: isActiveDate ? getChecklistSnapshot() : record.checklist || {},
    set_rows: isActiveDate ? getSetRowsSnapshot() : record.setRows || {},
    notes: record.notes || "",
    exercises: record.exercises || {},
    monitoring: record.monitoring || {},
    updated_at: record.updatedAt || new Date().toISOString()
  };
};

const saveSupabaseDate = async (dateKey) => {
  if (!canUseSupabaseSync() || !dateKey) return;

  try {
    setSyncStatus(t("sync.statusSaving"));
    const { error } = await syncState.client
      .from(SUPABASE_TABLE)
      .upsert(createSupabaseRow(dateKey), { onConflict: "user_id,date_key" });

    if (error) throw error;
    setSyncStatus(t("sync.statusSaved"), "connected");
  } catch (error) {
    console.warn("Could not save Supabase session.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const createSupabaseProfileRow = () => ({
  user_id: syncState.user.id,
  assessment: readJsonStorage(STORAGE_KEYS.assessment, {}),
  weekly_schedule: readJsonStorage(STORAGE_KEYS.weeklySchedule, []),
  safety_events: readJsonStorage(STORAGE_KEYS.safetyEvents, []),
  updated_at: new Date().toISOString()
});

const saveSupabaseProfile = async () => {
  if (!canUseSupabaseSync()) return;

  try {
    setSyncStatus(t("sync.statusSaving"));
    const { error } = await syncState.client
      .from(SUPABASE_PROFILE_TABLE)
      .upsert(createSupabaseProfileRow(), { onConflict: "user_id" });

    if (error) throw error;
    setSyncStatus(t("sync.statusSaved"), "connected");
  } catch (error) {
    console.warn("Could not save rehab profile.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const loadSupabaseProfile = async () => {
  if (!canUseSupabaseSync()) return;

  try {
    const { data, error } = await syncState.client
      .from(SUPABASE_PROFILE_TABLE)
      .select("*")
      .eq("user_id", syncState.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return;

    const assessment = isPlainObject(data.assessment) ? data.assessment : {};
    const weeklySchedule = Array.isArray(data.weekly_schedule) ? data.weekly_schedule : [];
    const safetyEvents = Array.isArray(data.safety_events) ? data.safety_events : [];

    syncState.isApplyingRemote = true;
    localStorage.setItem(STORAGE_KEYS.assessment, JSON.stringify(assessment));
    localStorage.setItem(STORAGE_KEYS.weeklySchedule, JSON.stringify(weeklySchedule));
    localStorage.setItem(STORAGE_KEYS.safetyEvents, JSON.stringify(safetyEvents));
    if (typeof data.updated_at === "string") {
      localStorage.setItem(STORAGE_KEYS.profileLastUpdated, data.updated_at);
    }
    restoreAssessment();
    renderWeeklySchedule();
    syncState.isApplyingRemote = false;
  } catch (error) {
    syncState.isApplyingRemote = false;
    console.warn("Could not load rehab profile.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const queueSupabaseSaveDate = (dateKey) => {
  if (!canUseSupabaseSync()) return;
  window.setTimeout(() => {
    saveSupabaseDate(dateKey);
  }, 0);
};

const createHistoryRecordFromSupabaseRow = (row) => {
  const dateKey = normalizeSupabaseDateKey(row.date_key);
  if (!dateKey || !createDateFromKey(dateKey)) return null;

  return {
    dateKey: dateKey,
    completed: row.completed === true,
    manualCompletion: row.manual_completion === true,
    updatedAt: row.updated_at || new Date().toISOString(),
    checklist: row.checklist && typeof row.checklist === "object" ? row.checklist : {},
    setRows: row.set_rows && typeof row.set_rows === "object" ? row.set_rows : {},
    exercises: row.exercises && typeof row.exercises === "object" ? row.exercises : {},
    monitoring: row.monitoring && typeof row.monitoring === "object" ? row.monitoring : {},
    notes: typeof row.notes === "string" ? row.notes : ""
  };
};

const applySessionRecordToCurrentView = (record) => {
  if (!record) return;

  if (record.checklist && typeof record.checklist === "object") {
    applyChecklistSnapshot(record.checklist);
    localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(getChecklistSnapshot()));
  }

  if (record.setRows && typeof record.setRows === "object") {
    applySetRowsSnapshot(record.setRows);
    localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(getSetRowsSnapshot()));
  }

  const notes = document.getElementById("session-notes");
  if (notes) {
    notes.value = typeof record.notes === "string" ? record.notes : "";
    localStorage.setItem(STORAGE_KEYS.notes, notes.value);
  }
};

const applySupabaseRows = (rows) => {
  syncState.isApplyingRemote = true;
  calendarState.sessionHistory = {};
  calendarState.completedDates = new Set();

  rows.forEach((row) => {
    const record = createHistoryRecordFromSupabaseRow(row);
    if (!record) return;

    calendarState.sessionHistory[record.dateKey] = record;
    if (record.completed) calendarState.completedDates.add(record.dateKey);
  });

  applySessionRecordToCurrentView(getSessionRecordForDate(getActiveDateKey()));

  writeSessionHistory();
  syncCompletedDatesWithHistory();
  renderSetRows();
  updateProgress();
  renderCalendar();
  renderSessionHistory();
  syncState.isApplyingRemote = false;
};

const seedSupabaseFromLocal = async () => {
  if (!syncState.client || !syncState.user) return;

  const dateKeys = getValidCompletedDates([
    ...Object.keys(calendarState.sessionHistory),
    ...Array.from(calendarState.completedDates)
  ]);

  if (dateKeys.length === 0) {
    setSyncStatus(t("sync.statusSignedIn"), "connected");
    return;
  }

  try {
    setSyncStatus(t("sync.statusSaving"));
    const { error } = await syncState.client
      .from(SUPABASE_TABLE)
      .upsert(dateKeys.map(createSupabaseRow), { onConflict: "user_id,date_key" });

    if (error) throw error;
    setSyncStatus(t("sync.statusSaved"), "connected");
  } catch (error) {
    console.warn("Could not seed Supabase sessions from local storage.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const loadSupabaseSessions = async () => {
  if (!syncState.client || !syncState.user) return;

  try {
    setSyncStatus(t("sync.statusLoading"));
    const { data, error } = await syncState.client
      .from(SUPABASE_TABLE)
      .select("*")
      .eq("user_id", syncState.user.id)
      .order("date_key", { ascending: true });

    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      await seedSupabaseFromLocal();
      return;
    }

    applySupabaseRows(rows);
    setSyncStatus(t("sync.statusSignedIn"), "connected");
  } catch (error) {
    console.warn("Could not load Supabase sessions.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const handleSupabaseSession = async (session) => {
  const nextUser = session?.user || null;
  const previousUserId = syncState.user?.id || null;
  syncState.user = nextUser;
  renderSyncAuthState();

  if (nextUser && nextUser.id !== previousUserId) {
    await loadSupabaseSessions();
    await loadSupabaseProfile();
  }
};

const getSyncCredentials = () => {
  const controls = getSyncControls();
  return {
    email: controls.email?.value.trim() || "",
    password: controls.password?.value || ""
  };
};

const signInToSupabase = async () => {
  if (!syncState.client) return;
  const credentials = getSyncCredentials();
  if (!credentials.email || !credentials.password) {
    setSyncStatus(t("sync.credentialsRequired"), "error");
    return;
  }

  try {
    setSyncStatus(t("sync.statusLoading"));
    const { data, error } = await syncState.client.auth.signInWithPassword(credentials);
    if (error) throw error;
    await handleSupabaseSession(data.session);
  } catch (error) {
    console.warn("Could not sign in to Supabase.", error);
    setSyncStatus(error.message || t("sync.statusError"), "error");
  }
};

const signUpForSupabase = async () => {
  if (!syncState.client) return;
  const credentials = getSyncCredentials();
  if (!credentials.email || !credentials.password) {
    setSyncStatus(t("sync.credentialsRequired"), "error");
    return;
  }

  try {
    setSyncStatus(t("sync.statusLoading"));
    const { data, error } = await syncState.client.auth.signUp(credentials);
    if (error) throw error;
    if (data.session) {
      await handleSupabaseSession(data.session);
    } else {
      setSyncStatus(t("sync.statusCheckEmail"));
    }
  } catch (error) {
    console.warn("Could not create Supabase account.", error);
    setSyncStatus(error.message || t("sync.statusError"), "error");
  }
};

const signOutOfSupabase = async () => {
  if (!syncState.client) return;

  try {
    await syncState.client.auth.signOut();
    syncState.user = null;
    renderSyncAuthState();
  } catch (error) {
    console.warn("Could not sign out of Supabase.", error);
    setSyncStatus(t("sync.statusError"), "error");
  }
};

const setupSupabaseSync = () => {
  syncState.client = createSupabaseClient();
  renderSyncAuthState();

  document.getElementById("sync-auth-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    signInToSupabase();
  });
  document.getElementById("sync-sign-up")?.addEventListener("click", signUpForSupabase);
  document.getElementById("sync-sign-out")?.addEventListener("click", signOutOfSupabase);

  if (!syncState.client) return;

  syncState.client.auth.getSession()
    .then(({ data }) => handleSupabaseSession(data.session))
    .catch((error) => {
      console.warn("Could not restore Supabase auth session.", error);
      setSyncStatus(t("sync.statusError"), "error");
    });

  syncState.client.auth.onAuthStateChange((_event, session) => {
    handleSupabaseSession(session);
  });
};

const createHistoryText = (text, className) => {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  return element;
};

const getSummaryRepStats = (record, group) => {
  const rows = group.setIds.map((setId) => ({
    setId: setId,
    state: record?.setRows?.[setId]
  }));
  if (rows.some(({ state }) => !state || typeof state !== "object")) return null;

  return rows.reduce((stats, { setId, state }) => {
    const config = getSetRowConfig(setId);
    const totalReps = Number(state.totalReps) > 0 ? Number(state.totalReps) : config.totalReps;
    const workDurationSec = Number(state.workDurationSec) > 0
      ? Number(state.workDurationSec)
      : config.workDurationSec;

    stats.totalReps += totalReps;
    stats.completedReps += state.isDone === true ? totalReps : 0;
    stats.workDurationSec = stats.workDurationSec || workDurationSec;
    return stats;
  }, { completedReps: 0, totalReps: 0, workDurationSec: 0 });
};

const getTodaySummaryExerciseParts = (record) => exerciseProgressGroups
  .map((group) => ({ group: group, exercise: record?.exercises?.[group.id] }))
  .filter(({ exercise }) => Number(exercise?.completedSets) > 0)
  .map(({ group, exercise }) => {
    const values = {
      exercise: getExerciseLabel(group.id),
      completed: Number(exercise.completedSets),
      total: Number(exercise.totalSets) || group.setIds.length
    };
    const repStats = getSummaryRepStats(record, group);
    if (!repStats) return t("todaySummary.exerciseSets", values);

    const key = group.id === "wall"
      ? "todaySummary.exerciseSetsWithRepsAndDuration"
      : "todaySummary.exerciseSetsWithReps";
    return t(key, {
      ...values,
      completedReps: repStats.completedReps,
      totalReps: repStats.totalReps,
      seconds: repStats.workDurationSec
    });
  });

const joinTodaySummaryParts = (parts) => {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    return t("todaySummary.joinTwo", { first: parts[0], second: parts[1] });
  }
  return t("todaySummary.joinMany", {
    items: parts.slice(0, -1).join(", "),
    last: parts.at(-1)
  });
};

const createTodaySummaryText = (record, dateKey = getTodayDateKey()) => {
  const date = formatDisplayDate(dateKey);
  const exerciseParts = getTodaySummaryExerciseParts(record);

  if (exerciseParts.length === 0) {
    return t("todaySummary.completedLegacy", { date: date });
  }

  return t("todaySummary.completed", {
    date: date,
    exercises: joinTodaySummaryParts(exerciseParts)
  });
};

const renderSelectedSessionSummary = () => {
  const dateElement = document.getElementById("todays-summary-date");
  const summaryElement = document.getElementById("todays-summary-text");
  if (!dateElement || !summaryElement) return;

  const dateKey = calendarState.selectedDateKey;
  dateElement.textContent = dateKey ? formatDisplayDate(dateKey) : t("calendar.selectDate");
  summaryElement.textContent = dateKey && calendarState.completedDates.has(dateKey)
    ? createTodaySummaryText(getSessionRecordForDate(dateKey), dateKey)
    : t("todaySummary.pending");
};

const renderSessionSummaryCopyButton = () => {
  const button = document.getElementById("copy-session-summary");
  const status = document.getElementById("copy-session-summary-status");
  if (!button) return;

  const dateKey = calendarState.selectedDateKey;
  button.disabled = !dateKey || !calendarState.completedDates.has(dateKey);
  button.textContent = t("todaySummary.copy");
  if (status) status.textContent = "";
};

const copySelectedSessionSummary = async () => {
  const summaryElement = document.getElementById("todays-summary-text");
  const status = document.getElementById("copy-session-summary-status");
  const dateKey = calendarState.selectedDateKey;
  if (!summaryElement || !status || !dateKey || !calendarState.completedDates.has(dateKey)) return;

  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(summaryElement.textContent);
    status.textContent = t("todaySummary.copied");
  } catch (error) {
    console.warn("Could not copy session summary.", error);
    status.textContent = t("todaySummary.copyFailed");
  }
};

const renderExerciseHistory = (container, exercises) => {
  const list = document.createElement("div");
  list.className = "history-exercise-list";

  exerciseProgressGroups.forEach((group) => {
    const exercise = exercises?.[group.id];
    const row = document.createElement("div");
    row.className = "history-exercise-row";

    const name = document.createElement("strong");
    name.textContent = getExerciseLabel(group.id);

    const details = document.createElement("span");
    details.textContent = exercise
      ? t("history.details", {
        setsCompleted: exercise.completedSets || 0,
        setsTotal: exercise.totalSets || group.setIds.length,
        checksCompleted: exercise.completedChecks || 0,
        checksTotal: exercise.totalChecks || group.checkIds.length
      })
      : t("history.noDetailSaved");

    const status = document.createElement("span");
    status.className = "history-status-badge";
    const statusKey = exercise?.statusKey || getStatusKey(exercise?.status);
    status.textContent = exercise ? t(statusKey) : t("status.noDetail");
    status.classList.add(
      statusKey === "status.finished" ? "finished" : statusKey === "status.inProgress" ? "in-progress" : "not-started"
    );

    row.append(name, details, status);
    list.appendChild(row);
  });

  container.appendChild(list);
};

const renderMonitoringHistory = (container, monitoring) => {
  const monitoringItems = [
    [t("history.immediate"), monitoring?.immediate],
    [t("history.nextMorning"), monitoring?.nextMorning],
    [t("history.walking"), monitoring?.walking]
  ];
  const completedCount = monitoringItems.filter((item) => item[1] === true).length;
  const summary = createHistoryText(t("history.monitoring", {
    completed: completedCount,
    total: monitoringItems.length
  }), "history-summary");
  const list = document.createElement("ul");
  list.className = "history-monitoring-list";

  monitoringItems.forEach(([label, isComplete]) => {
    const item = document.createElement("li");
    item.textContent = `${label}: ${isComplete ? t("history.done") : t("history.notDone")}`;
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
  heading.textContent = t("history.heading");
  panel.appendChild(heading);

  if (!dateKey) {
    panel.appendChild(createHistoryText(t("history.selectDate"), "history-empty"));
    return;
  }

  const record = calendarState.sessionHistory[dateKey];
  if (!record) {
    const message = calendarState.completedDates.has(dateKey)
      ? t("history.completedNoDetail")
      : t("history.noSession");
    panel.appendChild(createHistoryText(message, "history-empty"));
    return;
  }

  const completionText = record.completed ? t("history.completed") : t("history.notCompleted");
  const updatedText = record.updatedAt ? formatDateTime(record.updatedAt) : t("history.noUpdate");
  panel.appendChild(createHistoryText(`${completionText} - ${t("history.updated", { date: updatedText })}`, "history-summary"));

  renderExerciseHistory(panel, record.exercises);
  renderMonitoringHistory(panel, record.monitoring);

  const notes = document.createElement("div");
  notes.className = "history-notes";
  const notesLabel = document.createElement("strong");
  notesLabel.textContent = t("notes.label");
  const notesText = document.createElement("p");
  notesText.textContent = record.notes?.trim() || t("history.noNotes");
  notes.append(notesLabel, notesText);
  panel.appendChild(notes);
};

const setSessionEditingDisabled = (isDisabled) => {
  document.querySelectorAll([
    "[data-checklist-item]",
    ".set-play-button",
    ".set-done input",
    '[id$="-set-reset"]',
    "#reset-all-sets",
    "#reset-checklist",
    "#clear-notes",
    "#session-notes",
    "#daily-log-form input",
    "#daily-log-form select",
    "#daily-log-form button"
  ].join(",")).forEach((element) => {
    element.disabled = isDisabled;
  });
};

const applySelectedDateSession = () => {
  const dateKey = getActiveDateKey();
  const isFutureDate = isFutureDateKey(dateKey);

  setSessionEditingDisabled(isFutureDate);
  setupSessionMeta();

  if (isFutureDate) {
    clearSetRowInterval();
    applySessionRecordToCurrentView(createMinimalSessionHistoryRecord(dateKey, false));
    renderSetRows();
    updateProgress();
    restoreDailyLog();
    return;
  }

  clearSetRowInterval();
  applySessionRecordToCurrentView(getSessionRecordForDate(dateKey));
  renderSetRows();
  ensureSetRowInterval();
  updateProgress();
  restoreDailyLog();
};

const selectCalendarDate = (dateKey) => {
  if (dateKey === calendarState.selectedDateKey) {
    renderCalendar();
    return;
  }

  saveActiveSessionHistory();
  calendarState.selectedDateKey = dateKey;
  applySelectedDateSession();
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
  saveActiveSessionHistory();
  const todayKey = getTodayDateKey();
  calendarState.completedDates.add(todayKey);
  calendarState.selectedDateKey = todayKey;
  applySelectedDateSession();
  saveTodaySessionHistory({ completed: true, manualCompletion: true });
  saveCompletedDates();
  renderCalendar();
};

const renderSelectedDay = () => {
  const selectedDate = document.getElementById("selected-calendar-date");
  const toggleButton = document.getElementById("toggle-selected-complete");
  const dateKey = calendarState.selectedDateKey;

  if (selectedDate) {
    selectedDate.textContent = dateKey ? formatDisplayDate(dateKey) : t("calendar.selectDate");
  }

  renderSelectedSessionSummary();
  renderSelectedSessionCompletionButton();
  renderSessionSummaryCopyButton();

  if (!toggleButton) return;

  const isFutureDate = dateKey ? isFutureDateKey(dateKey) : false;
  const isCompleted = dateKey ? calendarState.completedDates.has(dateKey) : false;

  toggleButton.disabled = !dateKey || isFutureDate;
  toggleButton.textContent = isCompleted ? t("calendar.unmarkComplete") : t("calendar.markComplete");
  renderSessionHistory();
};

const renderTodayCompletionButton = () => {
  const button = document.getElementById("mark-today-complete");
  if (!button) return;

  const todayKey = getTodayDateKey();
  const isComplete = calendarState.completedDates.has(todayKey);
  const canMarkToday = getActiveDateKey() === todayKey && canCompleteToday() && !isComplete;

  button.disabled = !canMarkToday;
  button.textContent = isComplete ? t("calendar.todayCompleted") : t("calendar.markToday");
};

const renderSelectedSessionCompletionButton = () => {
  const button = document.getElementById("summary-mark-today-complete");
  if (!button) return;

  const dateKey = calendarState.selectedDateKey;
  const isCompleted = dateKey ? calendarState.completedDates.has(dateKey) : false;
  const isFutureDate = dateKey ? isFutureDateKey(dateKey) : false;

  button.disabled = !dateKey || isFutureDate || isCompleted;
  button.textContent = isCompleted ? t("history.completed") : t("calendar.markComplete");
};

const renderCalendar = () => {
  const calendarMonth = document.getElementById("calendar-month");
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) return;

  const year = calendarState.visibleDate.getFullYear();
  const month = calendarState.visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = getTodayDateKey();

  if (calendarMonth) {
    calendarMonth.textContent = new Intl.DateTimeFormat(getCurrentLocale(), {
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
    dayButton.setAttribute("aria-label", `${formatDisplayDate(dateKey)}${isCompleted ? t("calendar.completedAria") : ""}`);
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

const clampNumber = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const readJsonStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn(`Could not parse ${key}. Resetting value.`, error);
    localStorage.removeItem(key);
    return fallback;
  }
};

const getAssessmentSnapshot = () => ({
  painLevel: clampNumber(document.getElementById("pain-level")?.value, 0, 10),
  injuryHistory: String(document.getElementById("injury-history")?.value || "").trim(),
  commitmentDays: clampNumber(document.getElementById("commitment-days")?.value, 1, 7),
  supportAvailable: document.getElementById("support-available")?.checked === true
});

const SCHEDULE_FOCUS_KEYS = {
  foundation: "schedule.focus.foundation",
  static: "schedule.focus.static",
  dynamic: "schedule.focus.dynamic"
};

const LEGACY_SCHEDULE_FOCUS_KEYS = {
  "Foundation activation": SCHEDULE_FOCUS_KEYS.foundation,
  "Static wall support": SCHEDULE_FOCUS_KEYS.static,
  "Supported dynamic control": SCHEDULE_FOCUS_KEYS.dynamic
};

const generateWeeklySchedule = (assessment) => {
  const days = clampNumber(assessment.commitmentDays, 1, 7);
  const maxPhase = assessment.supportAvailable && assessment.painLevel <= PROGRESSION_RULES.maxPainForProgression ? 3 : 1;
  return Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    phaseNumber: maxPhase === 1 ? 1 : index < 2 ? 1 : index < 4 ? 2 : 3,
    focusKey: maxPhase === 1
      ? SCHEDULE_FOCUS_KEYS.foundation
      : index < 2
        ? SCHEDULE_FOCUS_KEYS.foundation
        : index < 4
          ? SCHEDULE_FOCUS_KEYS.static
          : SCHEDULE_FOCUS_KEYS.dynamic
  }));
};

const saveAssessment = (assessment) => {
  const schedule = generateWeeklySchedule(assessment);
  localStorage.setItem(STORAGE_KEYS.assessment, JSON.stringify(assessment));
  localStorage.setItem(STORAGE_KEYS.weeklySchedule, JSON.stringify(schedule));
  localStorage.setItem(STORAGE_KEYS.profileLastUpdated, new Date().toISOString());
  renderWeeklySchedule();
  saveSupabaseProfile();
};

const isValidWeeklyScheduleEntry = (day) => {
  if (!day || typeof day !== "object" || Array.isArray(day)) return false;
  if (!Number.isInteger(day.dayNumber) || day.dayNumber < 1 || day.dayNumber > 7) return false;
  if (!Number.isInteger(day.phaseNumber) || day.phaseNumber < 1 || day.phaseNumber > 3) return false;
  return typeof day.focusKey === "string" || typeof day.focus === "string";
};

const renderWeeklyScheduleEmptyState = (container) => {
  const message = document.createElement("p");
  message.className = "muted-text";
  message.textContent = t("schedule.empty");
  container.replaceChildren(message);
};

const getScheduleFocusText = (day) => {
  const focusKey = day.focusKey || LEGACY_SCHEDULE_FOCUS_KEYS[day.focus];
  return focusKey ? t(focusKey) : String(day.focus || "");
};

const renderWeeklySchedule = () => {
  const container = document.getElementById("weekly-schedule-list");
  if (!container) return;

  const schedule = readJsonStorage(STORAGE_KEYS.weeklySchedule, []);
  const safeSchedule = Array.isArray(schedule) ? schedule.filter(isValidWeeklyScheduleEntry) : [];
  if (safeSchedule.length === 0) {
    renderWeeklyScheduleEmptyState(container);
    return;
  }

  const rows = safeSchedule.map((day) => {
    const row = document.createElement("article");
    const dayLabel = document.createElement("strong");
    const phaseLabel = document.createElement("span");
    const focus = document.createElement("p");

    row.className = "schedule-row";
    dayLabel.textContent = t("schedule.dayLabel", { number: day.dayNumber });
    phaseLabel.textContent = t("schedule.phaseLabel", { number: day.phaseNumber });
    focus.textContent = getScheduleFocusText(day);

    row.append(dayLabel, phaseLabel, focus);
    return row;
  });

  container.replaceChildren(...rows);
};

const restoreAssessment = () => {
  const assessment = readJsonStorage(STORAGE_KEYS.assessment, null);
  if (!assessment) return;

  const painLevel = document.getElementById("pain-level");
  const injuryHistory = document.getElementById("injury-history");
  const commitmentDays = document.getElementById("commitment-days");
  const supportAvailable = document.getElementById("support-available");

  if (painLevel) painLevel.value = String(assessment.painLevel ?? "");
  if (injuryHistory) injuryHistory.value = assessment.injuryHistory || "";
  if (commitmentDays) commitmentDays.value = String(assessment.commitmentDays ?? "");
  if (supportAvailable) supportAvailable.checked = assessment.supportAvailable === true;
};

const renderAssessmentStatus = (isSaved = readJsonStorage(STORAGE_KEYS.assessment, null) !== null) => {
  const status = document.getElementById("assessment-status");
  if (status) status.textContent = t(isSaved ? "assessment.statusSaved" : "assessment.statusNotSaved");
};

const setupAssessment = () => {
  restoreAssessment();
  renderAssessmentStatus();
  renderWeeklySchedule();

  document.getElementById("assessment-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAssessment(getAssessmentSnapshot());
    renderAssessmentStatus(true);
  });
};

const setupCalendar = () => {
  calendarState.sessionHistory = readStoredSessionHistory();
  calendarState.completedDates = new Set(readStoredCompletedDates());
  syncCompletedDatesWithHistory();
  calendarState.selectedDateKey = getTodayDateKey();
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
  document.getElementById("summary-mark-today-complete")?.addEventListener("click", () => {
    const dateKey = calendarState.selectedDateKey;
    if (dateKey && !isFutureDateKey(dateKey) && !calendarState.completedDates.has(dateKey)) {
      toggleDateCompletion(dateKey);
    }
  });
  document.getElementById("copy-session-summary")?.addEventListener("click", copySelectedSessionSummary);
  document.getElementById("toggle-selected-complete")?.addEventListener("click", () => {
    toggleDateCompletion(calendarState.selectedDateKey);
  });
};

const saveChecklist = () => {
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(getChecklistSnapshot()));
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
  renderMobileSessionMode();
};

const restoreChecklist = () => {
  applyChecklistSnapshot(readStoredChecklist());
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

const CUE_TRANSLATION_KEYS = {
  Hold: "cue.hold",
  Resting: "cue.resting",
  Relax: "cue.relax",
  Lift: "cue.lift",
  Open: "cue.open"
};

const getCueTranslationKey = (cue) => CUE_TRANSLATION_KEYS[cue] || "";

const getWorkCueKey = (setId) => {
  const config = getSetRowConfig(setId);
  return getCueTranslationKey(config.workCue);
};

const getRestCueKey = (setId) => {
  const config = getSetRowConfig(setId);
  return getCueTranslationKey(config.restCue);
};

const getTranslatedCueMessage = (cue, translationKey) => translationKey ? t(translationKey) : cue;

const getWorkCueMessage = (setId) => {
  const config = getSetRowConfig(setId);
  return getTranslatedCueMessage(config.workCue, getWorkCueKey(setId));
};

const getRestCueMessage = (setId) => {
  const config = getSetRowConfig(setId);
  return getTranslatedCueMessage(config.restCue, getRestCueKey(setId));
};

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
  if (status) status.textContent = audioCueState.isEnabled ? t("voice.on") : t("voice.off");
};

const setupVoiceCues = () => {
  audioCueState.isEnabled = readStoredVoiceCuePreference();
  renderVoiceCueControl();

  document.getElementById("voice-cues-toggle")?.addEventListener("change", (event) => {
    audioCueState.isEnabled = event.target.checked;
    saveVoiceCuePreference();
    renderVoiceCueControl();

    if (audioCueState.isEnabled) {
      playAudioCue(t("voice.on"), 880, 0.12);
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
        playAudioCue(t("cue.setComplete"), 1200, 0.6);
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

const getSetRowElement = (setId) => typeof document.querySelector === "function"
  ? document.querySelector(`[data-set-row="${setId}"]`)
  : null;

const getSetRowControl = (setId, suffix, selector) => {
  const row = getSetRowElement(setId);
  return document.getElementById(`${setId}-${suffix}`) || row?.querySelector(selector);
};

const getSetNumberFromTracker = (setId, exerciseId) => {
  const tracker = exerciseSetTrackers.find((item) => item.id === exerciseId);
  const setIndex = tracker?.sets.findIndex((item) => item.id === setId) ?? -1;
  return setIndex >= 0 ? String(setIndex + 1) : setId.replace(getExerciseIdFromSetId(setId), "").replace(/^-/, "");
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
        targetSpan.textContent = t("set.repsDone", { count: rowState.totalReps });
      } else if (rowState.repState === "work") {
        targetSpan.textContent = t(
          config.activeTargetPrefix.startsWith("HOLD") ? "set.activeHoldRep" : "set.activeRep",
          { current: rowState.currentRep, total: rowState.totalReps }
        );
      } else if (rowState.repState === "rest") {
        targetSpan.textContent = t("set.resting", { cue: getRestCueMessage(set.id) });
      } else {
        targetSpan.textContent = t("set.reps", { count: rowState.totalReps });
      }
    }
  } else {
    const elapsedMs = getCurrentSetRowElapsedMs(set.id);
    if (timer) timer.textContent = formatTimer(elapsedMs);
    if (targetSpan) targetSpan.textContent = set.target;
  }

  if (toggle) {
    toggle.textContent = rowState.isRunning ? "❚❚" : "▶";
    const exerciseId = getExerciseIdFromSetId(set.id);
    const setNumber = getSetNumberFromTracker(set.id, exerciseId);
    toggle.setAttribute("aria-label", t(rowState.isRunning ? "set.pauseLabel" : "set.startLabel", {
      exercise: getExerciseLabel(exerciseId),
      number: setNumber
    }));
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
  renderMobileSessionMode();
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

  const shouldReset = window.confirm(t("reset.exerciseSetsConfirm", {
    exercise: getExerciseLabel(tracker.id)
  }));
  if (!shouldReset) return;

  resetSetRowsForTrackers([tracker]);
};

const resetAllSetRows = () => {
  const shouldReset = window.confirm(t("reset.allSetsConfirm"));
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

const readDailyLogs = () => {
  const logs = readJsonStorage(STORAGE_KEYS.dailyLogs, {});
  return logs && typeof logs === "object" && !Array.isArray(logs) ? logs : {};
};

const writeDailyLogs = (logs) => {
  localStorage.setItem(STORAGE_KEYS.dailyLogs, JSON.stringify(logs));
};

const readRequiredPainValue = (elementId) => {
  const value = document.getElementById(elementId)?.value;
  if (typeof value !== "string" || value.trim() === "") return null;

  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  return Math.min(10, Math.max(0, Math.round(number)));
};

const getDailyLogSnapshot = () => ({
  dateKey: getActiveDateKey(),
  painBefore: readRequiredPainValue("pain-before"),
  painAfter: readRequiredPainValue("pain-after"),
  swellingStatus: document.getElementById("swelling-status")?.value || "none",
  sharpPain: document.getElementById("sharp-pain")?.checked === true,
  phaseCompleted: clampNumber(document.getElementById("phase-completed")?.value, 1, 3),
  updatedAt: new Date().toISOString()
});

const evaluateSafetyGuardrails = (log) => {
  if (!Number.isFinite(log.painBefore) || !Number.isFinite(log.painAfter)) {
    return t("safety.missingPain");
  }

  const painIncrease = log.painAfter - log.painBefore;
  const exceedsStablePainLimit = log.painBefore > PROGRESSION_RULES.maxPainForProgression
    || log.painAfter > PROGRESSION_RULES.maxPainForProgression;
  if (log.sharpPain && PROGRESSION_RULES.sharpPainBlocksProgression) {
    return t("safety.sharpPain");
  }
  if (log.swellingStatus === "increased" && PROGRESSION_RULES.swellingBlocksProgression) {
    return t("safety.swelling");
  }
  if (exceedsStablePainLimit || painIncrease > PROGRESSION_RULES.maxPainIncrease) {
    return t("safety.painLimit");
  }
  return t("safety.alertStable");
};

const saveDailyLog = (log) => {
  if (!log.dateKey || isFutureDateKey(log.dateKey)) return;

  const logs = readDailyLogs();
  logs[log.dateKey] = log;
  writeDailyLogs(logs);

  const alert = document.getElementById("safety-alert");
  if (alert) alert.textContent = evaluateSafetyGuardrails(log);

  saveActiveSessionHistoryLocalOnly();
  renderSessionHistory();
  saveLastUpdated();
};

const restoreDailyLog = () => {
  const log = readDailyLogs()[getActiveDateKey()];
  const painBefore = document.getElementById("pain-before");
  const painAfter = document.getElementById("pain-after");
  const swellingStatus = document.getElementById("swelling-status");
  const sharpPain = document.getElementById("sharp-pain");
  const phaseCompleted = document.getElementById("phase-completed");
  const alert = document.getElementById("safety-alert");

  if (!log) {
    if (painBefore) painBefore.value = "";
    if (painAfter) painAfter.value = "";
    if (swellingStatus) swellingStatus.value = "none";
    if (sharpPain) sharpPain.checked = false;
    if (phaseCompleted) phaseCompleted.value = "1";
    if (alert) alert.textContent = "";
    return;
  }

  if (painBefore) painBefore.value = String(log.painBefore ?? "");
  if (painAfter) painAfter.value = String(log.painAfter ?? "");
  if (swellingStatus) swellingStatus.value = log.swellingStatus || "none";
  if (sharpPain) sharpPain.checked = log.sharpPain === true;
  if (phaseCompleted) phaseCompleted.value = String(log.phaseCompleted ?? 1);
  if (alert) alert.textContent = evaluateSafetyGuardrails(log);
};

const setupDailyLog = () => {
  restoreDailyLog();
  document.getElementById("daily-log-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveDailyLog(getDailyLogSnapshot());
  });
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
    const shouldClear = window.confirm(t("notes.clearConfirm"));
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
    const shouldReset = window.confirm(t("reset.checklistConfirm"));
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
  toggle.textContent = isCollapsed ? t("checklist.show") : t("checklist.hide");
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
  const activeDate = createDateFromKey(getActiveDateKey()) || new Date();

  document.getElementById("session-date").textContent = new Intl.DateTimeFormat(getCurrentLocale(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(activeDate);

  document.getElementById("last-updated").textContent = formatDateTime(
    getSessionRecordForDate(getActiveDateKey())?.updatedAt || localStorage.getItem(STORAGE_KEYS.lastUpdated)
  );
};

document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSwitcher();
  setupSessionMeta();
  setupAssessment();
  setupCalendar();
  restoreChecklist();
  setupChecklistListeners();
  setupChecklistCollapse();
  setupVoiceCues();
  setupDailyLog();
  setupNotes();
  setupReset();
  setupSetRows();
  applySelectedDateSession();
  setupMobileSessionMode();
  setupSupabaseSync();
});
