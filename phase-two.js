// Register the bodyweight program before the shared tracker initializes.
(() => {
  const translations = { en: {}, th: {} };
  const text = (key, en, th) => {
    translations.en[key] = en;
    translations.th[key] = th;
    return `<span data-i18n="${key}">${en}</span>`;
  };
  const definitions = [
    { id: "p2-chair", name: ["High-chair squat", "Squat แตะเก้าอี้สูง"], reps: 8, work: 3, rest: 3, cues: ["Lower", "Stand"],
      dosage: ["2 sets × 8 reps · lower for 3 seconds", "2 เซต × 8 ครั้ง · ลดตัว 3 วินาที"],
      checks: [
        ["setup", "Use a high chair without wheels, secured against a wall. Stand on both feet; a heavy desk can support your hands.", "ใช้เก้าอี้สูงไม่มีล้อ วางชิดผนัง ยืนสองขา ใช้โต๊ะหนักช่วยพยุงมือได้"],
        ["control", "Move hips back and lower slowly in a shallow range. You need not reach the chair if that hurts. Keep knees moving with your toes.", "ถอยสะโพก ย่อตื้นและลดตัวช้า ไม่ต้องถึงเก้าอี้ถ้าช่วงนั้นเจ็บ คุมเข่าไปทางเดียวกับปลายเท้า"],
        ["safety", "Reduce depth or use more hand support if pain rises or shaking disrupts control. Stop the set if this does not help.", "ลดความลึกหรือเพิ่มแรงช่วยจากมือเมื่อเจ็บเพิ่มหรือสั่นจนคุมไม่ได้ ถ้าไม่ดีขึ้นให้จบเซต"] ] },
    { id: "p2-split", name: ["Supported split squat", "Split Squat แบบมีที่พยุง"], reps: 6, work: 3, rest: 3, cues: ["Lower", "Stand"], sides: true,
      dosage: ["2 sets × 6 reps per side · left and right tracked separately", "2 เซต × 6 ครั้ง/ข้าง · แยกเซตซ้ายและขวา"],
      checks: [
        ["setup", "Use a staggered stance beside a heavy desk or a chair secured against a wall. Keep both feet supporting your weight.", "ยืนเท้าหน้า–หลังข้างโต๊ะหนักหรือเก้าอี้ชิดผนัง ให้เท้าทั้งสองช่วยรับน้ำหนัก"],
        ["control", "Bend both knees a little, lower for 3 seconds, then rise. Use your hands and stay within a controlled range.", "งอเข่าทั้งสองเล็กน้อย ลดตัว 3 วินาทีแล้วกลับขึ้น ใช้มือช่วยและย่อเฉพาะช่วงที่คุมได้"],
        ["safety", "Use more hand support or less depth when shaking affects control. Skip this exercise if it remains difficult or painful.", "เพิ่มแรงช่วยจากมือหรือลดช่วงย่อเมื่อสั่นจนคุมไม่ได้ ถ้ายังยากหรือเจ็บเพิ่มให้ข้ามท่านี้"] ] },
    { id: "p2-bridge", name: ["Glute bridge", "Glute Bridge"], reps: 10, work: 3, rest: 3, cues: ["Lift", "Relax"],
      dosage: ["2 sets × 10 reps · lift and lower slowly", "2 เซต × 10 ครั้ง · ยกและลดช้า ๆ"],
      checks: [
        ["setup", "Lie on the floor on a mat or thin blanket, knees bent and feet flat. Avoid a soft bed.", "นอนบนพื้นปูเสื่อหรือผ้าห่มบาง งอเข่า วางเท้าราบ ไม่ใช้เตียงนิ่ม"],
        ["control", "Press through your feet and squeeze your glutes to lift your hips without arching your back. Lower slowly.", "กดเท้าและเกร็งก้นเพื่อยกสะโพก ไม่แอ่นหลัง ลดสะโพกอย่างช้า ๆ"],
        ["safety", "Reduce lift height or repetitions. Stop if knee pain increases, or your back or hamstrings hurt.", "ลดความสูงหรือจำนวนครั้ง หยุดเมื่อปวดเข่าเพิ่ม ปวดหลัง หรือเจ็บกล้ามเนื้อหลังต้นขา"] ] },
    { id: "p2-side", name: ["Side-lying leg lift", "Side-lying Leg Lift"], reps: 10, work: 3, rest: 3, cues: ["Lift", "Relax"], sides: true,
      dosage: ["2 sets × 10 reps per side · left and right tracked separately", "2 เซต × 10 ครั้ง/ข้าง · แยกเซตซ้ายและขวา"],
      checks: [
        ["setup", "Lie on your side on a mat or thin blanket. Bend the lower knee and straighten the upper leg.", "นอนตะแคงบนเสื่อหรือผ้าห่มบาง งอขาล่างและเหยียดขาบน"],
        ["control", "Lift the upper leg a little and lower slowly. Keep hips stacked without rolling backward.", "ยกขาบนเล็กน้อยแล้วลดช้า ๆ ให้สะโพกซ้อนกัน ไม่กลิ้งตัวไปหลัง"],
        ["safety", "Lift lower or reduce repetitions if your trunk starts moving. Stop if knee pain increases.", "ยกต่ำลงหรือลดจำนวนครั้งเมื่อเริ่มโยกลำตัว หยุดเมื่อปวดเข่าเพิ่ม"] ] }
  ];
  text("program.original", "Original program", "โปรแกรมเดิม");
  text("program.phaseTwo", "Phase 2 · Strength & control", "Phase 2 · ฝึกแรงและควบคุมเข่า");
  const intro = `<section class="card plan-card mobile-secondary phase-two-intro">
    <h2>${text("p2.title", "Phase 2: Strength & control", "Phase 2: ฝึกแรงและควบคุมเข่า")}</h2>
    <p>${text("p2.frequency", "Bodyweight · 2–3 days per week with rest days. Rest 60–90 seconds between sets.", "ใช้น้ำหนักตัว · สัปดาห์ละ 2–3 วัน เว้นวันพัก พัก 60–90 วินาทีระหว่างเซต")}</p>
    <p>${text("p2.equipment", "Use a stable chair against a wall, a heavy desk, and a mat or thin blanket on the floor. No bands or dumbbells. Avoid wheels, unstable furniture, and soft beds.", "ใช้เก้าอี้มั่นคงชิดผนัง โต๊ะหนัก และพื้นปูเสื่อหรือผ้าห่มบาง ไม่ต้องใช้ band หรือ dumbbell หลีกเลี่ยงเก้าอี้มีล้อ เฟอร์นิเจอร์ที่โยก และเตียงนิ่ม")}</p>
    <p class="safety-note">${text("p2.safety", "Keep pain around 2–3/10 or less without a steady increase. Reduce depth or use your hands if shaking affects control. Symptoms should ease after training and be no worse next morning. Stop and seek assessment for swelling, locking, or giving way.", "ปวดไม่เกินประมาณ 2–3/10 และไม่เพิ่มต่อเนื่อง ลดความลึกหรือใช้มือช่วยเมื่อสั่นจนคุมไม่ได้ หลังฝึกควรทุเลาและเช้าวันถัดไปไม่แย่กว่าเดิม หยุดและรับการประเมินเมื่อบวม ล็อก หรือเข่าทรุดจริง")}</p>
    <p>${text("p2.limit", "This PFPS starting routine is separate from the original three-stage plan. Adapt it with your physiotherapist; do not add jumping or unsupported single-leg squats yet. A timer guides pace, not a requirement to complete every repetition.", "ชุดเริ่มต้นสำหรับ PFPS นี้แยกจากระยะ 1–3 ในโปรแกรมเดิม ปรับร่วมกับนักกายภาพ ยังไม่เพิ่มกระโดดหรือย่อขาเดียวเต็มน้ำหนัก ตัวจับเวลาช่วยกำหนดจังหวะ ไม่จำเป็นต้องฝืนทำครบทุกครั้ง")}</p>
    <details><summary>${text("p2.sources", "Exercise sources", "แหล่งอ้างอิง")}</summary><p><a href="https://www.massgeneral.org/assets/mgh/pdf/orthopaedics/sports-medicine/physical-therapy/rehabilitation-protocol-for-patellofemoral-pain-syndrome.pdf">Mass General Brigham · PFPS</a> · <a href="https://www.dynamichealth.nhs.uk/help-and-advice/knee-pain/patellofemoral-knee-pain/">NHS · PFPS</a></p></details>
  </section>`;
  const exercises = [];
  const configs = {};
  let cards = intro;
  definitions.forEach((definition, index) => {
    const { id, name, reps, work, rest, cues, sides, checks } = definition;
    text(`exercise.${id}`, ...name);
    const setIds = sides ? [1, 2, 3, 4].map(n => `${id}-${n}`) : [1, 2].map(n => `${id}-${n}`);
    const checkIds = checks.map(([suffix]) => `${id}-${suffix}`);
    exercises.push({ id, program: "phaseTwo", phaseId: "phase-2-static-load", setIds, checkIds, target: definition.dosage[0] });
    configs[id] = { totalReps: reps, workDurationSec: work, restDurationSec: rest, workCue: cues[0], restCue: cues[1], activeTargetPrefix: "Rep" };
    const heading = text(`p2.${id}.heading`, `Exercise ${index + 1}: ${name[0]}`, `ท่าที่ ${index + 1}: ${name[1]}`);
    const dosage = text(`p2.${id}.dosage`, ...definition.dosage);
    const rows = setIds.map((setId, i) => {
      const side = sides ? text(`p2.${id}.side.${i}`, `${i < 2 ? "Left" : "Right"} · Set ${i % 2 + 1}`, `${i < 2 ? "ซ้าย" : "ขวา"} · เซต ${i % 2 + 1}`) : "";
      return `<div class="set-row" data-set-row="${setId}">
        <span class="set-number">${i + 1}</span><span id="${setId}-timer" class="set-time" aria-live="polite">00:03</span>
        <span class="set-target">Rep 1/${reps}</span><button type="button" id="${setId}-toggle" class="set-play-button" aria-label="Start ${name[0]} set ${i + 1}">▶</button>
        <label class="set-done"><input type="checkbox" id="${setId}-done" aria-label="${name[0]} set ${i + 1} done" /><span>Done</span></label>
        ${side ? `<div class="phase-two-side">${side}</div>` : ""}
      </div>`;
    }).join("");
    const checklist = checks.map(([suffix, en, th]) => `<div class="check-item${suffix === "safety" ? " warning-item" : ""}">
      <input type="checkbox" id="${id}-${suffix}" data-checklist-item /><label for="${id}-${suffix}">${text(`p2.${id}.${suffix}`, en, th)}</label></div>`).join("");
    cards += `<section id="${id}-card" class="card checklist-card accent-blue" data-mobile-step="${id}" aria-labelledby="${id}-heading">
      <div class="section-heading compact"><div><h2 id="${id}-heading">${heading}</h2><p>${dosage}</p></div>
        <button type="button" class="checklist-toggle" aria-expanded="true" aria-controls="${id}-checklist">Hide Checklist</button></div>
      <p class="phase-two-safety">${text(`p2.${id}.reminder`, "Reduce range or stop if pain rises or shaking disrupts control. Rest 60–90 seconds between sets.", "ลดช่วงหรือหยุดเมื่อเจ็บเพิ่มหรือสั่นจนคุมไม่ได้ พัก 60–90 วินาทีระหว่างเซต")}</p>
      <div class="set-tracker" data-set-tracker="${id}" role="group" aria-labelledby="${id}-set-heading">
        <div class="set-tracker-header"><div><h3 id="${id}-set-heading">${text(`p2.${id}.sets`, `${name[0]} Sets`, `เซต ${name[1]}`)}</h3>
        <p><span id="${id}-set-count">0</span> / <span id="${id}-set-total">${setIds.length}</span> sets</p></div>
        <button type="button" id="${id}-set-reset" class="button secondary-button" data-i18n="sets.reset">Reset Sets</button></div>${rows}</div>
      <div id="${id}-checklist" class="checklist">${checklist}</div></section>`;
  });
  document.getElementById("phase-two-panel").innerHTML = cards;
  const progressList = document.querySelector(".exercise-progress-list");
  exercises.forEach(({ id, setIds, checkIds }) => {
    const row = document.createElement("div");
    row.className = "exercise-progress-row";
    row.dataset.exerciseProgress = id;
    row.innerHTML = `<strong data-i18n="exercise.${id}">${translations.en[`exercise.${id}`]}</strong>
      <span><span id="${id}-progress-sets">0 / ${setIds.length}</span> sets</span>
      <span><span id="${id}-progress-checks">0 / ${checkIds.length}</span> checks</span>
      <span id="${id}-progress-status" class="status-badge">Not started</span>`;
    progressList.append(row);
  });
  document.getElementById("original-program-tab").dataset.i18n = "program.original";
  document.getElementById("phase-two-tab").dataset.i18n = "program.phaseTwo";
  window.KNEE_REHAB_PHASE_TWO = { exercises, configs, translations };
})();
