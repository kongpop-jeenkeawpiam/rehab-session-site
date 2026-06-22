# Selected Session Summary Design

## Goal

Add a text-only summary at the bottom of the page that records exercise work and session duration for the date selected in the calendar. The summary is generated only after the user marks that selected session complete.

## User Interface

Add a card immediately before the page footer with:

- the heading `Session Summary`;
- the selected calendar date in the active language;
- a `Mark Complete` button for the selected calendar date; and
- a plain-text summary area with no charts, icons, checklist details, or note content.

Before completion, the summary area explains that a summary will appear after the selected session is marked complete. The button is enabled for incomplete dates up to and including today, disabled for future dates, and replaced by a completed state for dates already marked complete. The existing calendar `Unmark Complete` control remains unchanged.

## Summary Content

After completion, the text contains:

- each exercise with at least one completed set, in protocol order;
- the completed and total set count for each included exercise; and
- the total session time.

Example:

> On June 22, 2026, you completed Wall Sit (2 of 2 sets) and Straight Leg Raise (3 of 3 sets). Session time: 18:42.

Exercises with zero completed sets are omitted. If no set details are available for a legacy completed session, the summary states that the session was completed without detailed exercise data.

## Data Flow and Persistence

The summary is derived from the existing session record rather than stored as an independent editable field. Rendering uses the selected date's persisted exercise and timer snapshots so the summary survives refreshes and remains consistent with session history.

The bottom button completes `calendarState.selectedDateKey`. Selecting a different calendar date rerenders the displayed date, button state, and summary. For today, the current in-memory exercise and timer snapshots are saved before completion; past sessions use their existing persisted snapshots.

## Internationalization

All labels, empty states, sentence fragments, exercise names, date formatting, set counts, and duration text support the existing English and Thai language modes.

## Error and Legacy Handling

- Missing or malformed exercise snapshots are ignored safely.
- Missing timer data renders a zero duration.
- A legacy completed record without details renders the legacy fallback message.
- The summary does not expose notes or checklist progress.

## Testing

Automated tests verify:

- the bottom section, selected date, summary area, and completion button exist;
- the bottom button completes the selected date and uses the label `Mark Complete`;
- future and already-completed dates disable the bottom button;
- selecting another calendar date rerenders the section;
- no summary is generated before completion;
- completed exercise sets and session duration appear after completion;
- zero-progress exercises, checklist progress, and notes are excluded;
- persisted and legacy records render safely; and
- English and Thai labels are available.
