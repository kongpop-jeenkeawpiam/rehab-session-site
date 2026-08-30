# Training Plan Layer Design

**Date:** 2026-08-30
**Status:** Approved in conversation
**Scope:** Add a selectable original rehab plan and a date-aware basketball-flex plan without removing existing exercises or legacy progress.

## Context

The tracker currently presents one three-phase rehab routine with eight exercises, per-set timers, technique checklists, daily safety logs, calendar history, bilingual UI, mobile navigation, local persistence, and optional Supabase synchronization.

The requested change introduces:

- **Set 1 — Original Rehab:** the current routine, unchanged.
- **Set 2 — Basketball-Flex:** a weekly plan resolved from the selected calendar date, with basketball allowed on any day.

The UI keeps the Set 1/Set 2 labels. Internally they are training plans with stable IDs `original-rehab` and `basketball-flex` so they are not confused with exercise set rows.

Set 2 content comes from the weekly plan supplied by the user. The app operationalizes that plan; it does not diagnose, prescribe progression beyond the supplied rules, or replace professional medical advice.

## Goals

- Preserve all eight Set 1 exercises, checklist items, timers, history, and stored progress.
- Switch plans through a dropdown.
- Resolve Set 2 automatically from the selected calendar date.
- Allow a basketball override on any day.
- Resolve the day after recorded basketball to Full Rest + Quad Set.
- Keep progress, resets, mobile navigation, localization, history, and sync scoped correctly.
- Reuse shared exercises while allowing plan-specific volume and cues.

## Non-goals

- Removing or rewriting Set 1.
- Automatically increasing exercise load or basketball frequency.
- Blocking consecutive basketball days.
- Adding clinical rules not present in the supplied plan.
- Reworking authentication or replacing Supabase.

## User Interface

A compact panel above Progress contains:

- A labelled `Training Set` select with `Set 1 — Original Rehab` and `Set 2 — Basketball-Flex`.
- The selected date and resolved protocol.
- A Set 2-only `Today’s Activity` select.
- A reason when previous-day basketball changes today’s protocol.
- A non-blocking load warning for consecutive or unusually frequent basketball records.

Legacy sessions default to Set 1. The most recent choice may be remembered as a UI preference, but each date stores its actual plan so preference changes cannot rewrite history.

Set 2 activity options are:

- `Follow plan`
- `Basketball today`
- `Recovery / Rest`
- `Skip training`

A change re-resolves the selected date, updates visible cards and totals, and saves the dated activity without deleting the other plan’s progress.

Only cards in the resolved session participate in progress and mobile navigation. Hidden exercises remain in the registry. Set 2 adds Calf Raises and Tibialis Raises plus lightweight action cards for mobility, sleep, game guidance, and rest.

## Set 2 Schedule

### Monday — Strength A

- Clamshells: 1 × 12
- Supported Mini Single Leg Squat: 2 × 5, tempo `3-1-1`, 30°–45°
- Glute Bridge: 2 × 12
- Calf Raises: 2 × 15
- Quad Set: 3 × 10

### Tuesday — Active Recovery

- Quad Set: 3 × 10
- Knee-to-Chest and light Quad Stretch

### Wednesday — Strength B

- Supported Mini Single Leg Squat: 2 × 5, tempo `3-1-1`, 30°–45°
- Tibialis Raises: 2–3 × 15
- Quad Set: 3 × 10

The UI shows three available Tibialis sets and marks set 3 optional, so completing the required two sets is distinguishable from extra work.

### Thursday — Active Recovery

- Quad Set: 3 × 10
- Hip and Quad Mobility: 5 minutes

### Friday — Pre-Game Prep

- Quad Set: 3 × 10
- Light joint mobilization
- Sleep recovery check

### Saturday and Sunday — Weekend Flex

- Default to Recovery + Quad Set rather than assuming a game.
- `Basketball today` changes the protocol to Game Day.
- A previous-day basketball record initially resolves to Full Rest + Quad Set.

## Protocol Resolution

For Set 2, resolve in this order:

1. Saved `basketball` → Game Day.
2. Saved `recovery` → Recovery + Quad Set.
3. Saved `skip` → Skip Training with no exercise checklist.
4. `follow-plan` plus previous-day basketball → Full Rest + Quad Set.
5. Otherwise → selected weekday’s base protocol.

An explicit user activity takes precedence. Consecutive basketball remains allowed but produces a warning. Future dates may preview a protocol but cannot be completed or create progress through ordinary interaction.

## Architecture

### Exercise registry

Create a data-driven registry of stable exercise IDs, localized labels, cues, safety text, and tracker/checklist behavior. Existing Set 1 IDs remain stable.

Plan prescriptions reference an exercise and provide plan-specific volume, optional sets, tempo, angle, and order. Shared exercises therefore keep one identity without forcing identical prescriptions.

### Plan definitions

Plan definitions:

- identify the plan;
- return a weekday’s base prescription;
- resolve activity overrides and previous-day recovery;
- return ordered items for rendering, progress, reset, and mobile navigation.

Protocol resolution must be a pure DOM-independent function with direct tests.

### Rendering

Set 1 initially retains current markup and IDs. The plan layer supplies active exercise IDs and prescriptions. Set 2 reuses compatible cards and adds new cards through the same conventions.

Progress and navigation must derive targets from the resolved session instead of globally querying every checkbox or mobile step.

## State and Compatibility

Each dated session gains backward-compatible fields equivalent to:

```json
{
  "planId": "basketball-flex",
  "activityType": "follow-plan",
  "resolvedProtocolId": "strength-b",
  "planChecklist": {},
  "planSetRows": {},
  "updatedAt": "ISO-8601 timestamp"
}
```

Checklist and timer state are isolated by date and plan. Notes, pain, swelling, sharp-pain status, and daily monitoring remain shared by date.

Legacy handling:

- Missing `planId` means `original-rehab`.
- Existing checklist and set-row keys remain readable and are not deleted.
- On first relevant save, legacy state may be copied into the Set 1 namespace while preserving the original fallback.
- Switching plans never clears inactive state.
- Reset Checklist and Reset Sets affect only the active date and plan after confirmation.

Supabase session payloads gain optional plan metadata and plan-scoped progress. Readers tolerate missing fields. Existing rows resolve as Set 1. Schema changes are made only if inspection proves the current JSON storage cannot carry the optional fields.

## Progress and History

- Count only required items in the resolved session.
- Optional Tibialis set 3 does not block required completion.
- History shows plan, resolved protocol, and actual activity.
- Calendar completion remains date-based; history identifies the completed plan.
- Switching plans restores that plan’s state without rewriting another plan.
- An informational trailing-seven-day basketball count can warn about load; it does not diagnose or authorize progression.

## Localization, Accessibility, and Mobile

- Add English and Thai strings for plans, activities, protocols, recovery reasons, and warnings.
- Give both selects visible labels and accessible descriptions.
- Announce protocol changes through a polite live region.
- Preserve focus after plan/activity changes.
- Build mobile steps from the resolved session.
- Handle zero-step Skip Training sessions without broken navigation.
- Fit controls at 320px without horizontal scrolling.

## Safety Behavior

Retain existing pain, swelling, and sharp-pain guardrails. Set 2 also displays the user-supplied rules:

- keep training pain at or below 3/10;
- stop at 4/10 or severe shaking;
- review the next morning’s response;
- use the specified firm arch-support insole for basketball;
- show supplied Game Day and post-game guidance.

Warnings remain informational and never claim a session is safe.

## Error Handling

- Unknown plan IDs fall back to Set 1.
- Unknown activity values fall back to `follow-plan`.
- Ignore invalid state only for the affected plan without deleting other valid state.
- Exclude missing exercise definitions from totals and show an unavailable-item message rather than breaking the page.
- Preserve local-first status messaging for storage or sync failures.

## Verification

Write automated tests before production logic for:

- legacy Set 1 fallback;
- Monday–Sunday base resolution;
- weekday basketball;
- next-day Full Rest + Quad Set;
- retained consecutive-basketball choice plus warning;
- date-and-plan state isolation;
- state restoration after switching;
- active-plan-only reset;
- optional Tibialis set 3 completion;
- future-date restrictions.

Browser verification covers desktop and 320px mobile, English and Thai, progress totals, mobile navigation for each session type, persistence after refresh, local-only mode, representative legacy data, no console errors, and no horizontal scrolling.

## Expected Implementation Files

- `index.html`: controls and Set 2 presentation hooks.
- `styles.css`: responsive controls and session states.
- `script.js`: registries, resolver, scoped state, rendering, migration, localization, history, mobile, and sync.
- Dependency-free automated tests and minimal runner wiring.
- `README.md` and `docs/api.md`: behavior and sync contract.
- `supabase-schema.sql` only if a backward-compatible schema addition is required.
