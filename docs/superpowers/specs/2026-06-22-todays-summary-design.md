# Today's Summary Design

## Goal

Add a text-only summary at the bottom of the page that records the exercise work and session duration for the current day. The summary is generated only after the user marks today complete.

## User Interface

Add a card immediately before the page footer with:

- the heading `Today's Summary`;
- today's localized display date;
- a second `Mark Today Complete` button synchronized with the existing header button; and
- a plain-text summary area with no charts, icons, checklist details, or note content.

Before completion, the summary area explains that a summary will appear after today is marked complete. Both completion buttons use the existing eligibility rules and show the same enabled, disabled, and completed states.

## Summary Content

After completion, the text contains:

- each exercise with at least one completed set, in protocol order;
- the completed and total set count for each included exercise; and
- the total session time.

Example:

> On June 22, 2026, you completed Wall Sit (2 of 2 sets) and Straight Leg Raise (3 of 3 sets). Session time: 18:42.

Exercises with zero completed sets are omitted. If no set details are available for a legacy completed session, the summary states that the session was completed without detailed exercise data.

## Data Flow and Persistence

The summary is derived from the existing session record rather than stored as an independent editable field. Marking today complete already saves set-row and timer snapshots; rendering uses those persisted snapshots so the summary survives refreshes and remains consistent with session history.

The bottom button calls the same completion handler as the existing header button. Any completion-state change rerenders both buttons and the summary.

## Internationalization

All labels, empty states, sentence fragments, exercise names, date formatting, set counts, and duration text support the existing English and Thai language modes.

## Error and Legacy Handling

- Missing or malformed exercise snapshots are ignored safely.
- Missing timer data renders a zero duration.
- A legacy completed record without details renders the legacy fallback message.
- The summary does not expose notes or checklist progress.

## Testing

Automated tests verify:

- the bottom section, date, summary area, and second completion button exist;
- both buttons invoke the shared completion action and stay synchronized;
- no summary is generated before completion;
- completed exercise sets and session duration appear after completion;
- zero-progress exercises, checklist progress, and notes are excluded;
- persisted and legacy records render safely; and
- English and Thai labels are available.
