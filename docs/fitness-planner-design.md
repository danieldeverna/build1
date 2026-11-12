# Design: Adaptive Fitness Planner

Generated: 2026-11-09  
Branch: `codex/initial-jarvis-build`  
Status: Preview framework implemented  
Mode: Personal builder project

## Problem statement

Jarvis needs to turn Daniel's fitness goals and changing weekly availability into a realistic lifting plan. It must protect consistency without treating every busy calendar day as a reason to skip training.

The primary outcome is a leaner, more defined "beach body" for summer while building upper-body muscle. Daniel is an intermediate lifter returning from a year of inconsistency, has full university-gym access, and can train three to four days per week.

## Constraints and preferences

- Schedule three protected workouts each week; add a fourth only when capacity genuinely exists.
- Fit each workout to a 60- or 75-minute opening. Do not schedule a session longer than 75 minutes in this phase.
- Reserve 10 minutes before a session for travel and 0–20 minutes after it.
- Never schedule early-morning workouts.
- Do not schedule a workout that runs past 8 PM on Wednesday, Friday, or Saturday.
- Existing calendar commitments are hard conflicts.
- A full day is acceptable. Remove or defer a protected workout only when academic/work preparation load is too high—not simply because the calendar looks busy.
- Automatically add approved plan sessions to the calendar. Never change or delete non-Jarvis events.
- Hevy is the workout-history and routine source. It currently has no workout history, so first-use onboarding must establish a baseline.
- Canvas/syllabus workload inference is explicitly deferred.

## What makes this useful

The experience should feel like a thoughtful training partner: it puts a sensible workout in a real opening, explains why that slot was chosen, and quietly adapts the duration to the time available. The user should not have to manually cross-reference a class calendar, task workload, and a separate workout app each week.

## Approved approach: protected adaptive planner

Build the minimum system that can create a repeatable three-day program, find safe calendar openings, and write trackable Jarvis workout events. Keep the data model ready for later Canvas workload scoring and Hevy-based progression, but do not block the first version on either capability.

### Approaches considered

**A. Manual planner**

- Shows routines and allows manual session placement.
- Smallest implementation, but fails the core promise of fitting training around real commitments.

**B. Protected adaptive planner — selected**

- Produces a three-day base plan, chooses 60- or 75-minute variants, finds compatible calendar openings, and adds Jarvis-owned calendar events.
- Provides the useful scheduling loop now while keeping workload intelligence as a later policy layer.

**C. Full workload-aware coach**

- Includes Canvas syllabus parsing, assignment effort estimates, and automatic workout removal from the outset.
- Best eventual system but prematurely depends on Canvas and a workload model that do not exist yet.

## Fitness-page framework

### 1. This week

The leading view is a compact week strip with three protected sessions and, when available, one optional session.

Each workout card shows:

- scheduled day and time;
- total reserved window and lifting duration;
- focus (for example, Upper Push, Upper Pull, Lower + Abs, or Optional Upper Accessory);
- status: protected, optional, completed, skipped, or deferred;
- a short scheduling reason such as “75-minute opening after class” or “moved to preserve upper-body recovery.”

### 2. Today

Show the current or next planned workout first. Include its exercise list, expected duration, warm-up note, and controls to complete, reschedule, or skip. A skip must ask for a reason so the later planner can distinguish lack of time, fatigue, and preference.

### 3. Program

Show the current program split and its 60- and 75-minute variants.

Initial default split:

1. Upper Push — chest, shoulders, triceps, optional short core work.
2. Upper Pull — back, rear delts, biceps, optional short core work.
3. Lower + Abs — legs plus direct abdominal work.
4. Optional Upper Accessory — arms, delts, upper chest/back, and conditioning only when capacity exists.

The exact exercises, loading, and progression rules are selected during onboarding and refined through Hevy completion history. The system must use Hevy's existing exercise templates before considering custom exercises.

### 4. Progress

Start with adherence and consistency: completed protected sessions, current streak, session duration fit, and skipped/deferred reasons. Add Hevy-derived volume, exercise progression, and strength trends after enough workout history exists.

## First-use onboarding

Collect only the information unavailable from Hevy or calendar data:

- current bodyweight and optional target/measurement preference;
- preferred exercise styles and disliked movements;
- approximate working-weight baseline or confidence level for major patterns;
- normal gym availability windows and any temporary schedule exceptions;
- whether Jarvis may create calendar events automatically (already approved for this design).

The onboarding result is a `FitnessProfile` and a first four-week return-to-consistency program. It should ramp volume conservatively because the user's previous training consistency has lapsed.

## Scheduling engine

### Inputs

- active `FitnessProfile` and weekly workout target;
- generated 60- and 75-minute workout variants;
- calendar events and free intervals;
- future task/workload score; and
- Hevy completion history once available.

### Slot requirements

For a 60-minute lift, require at least 70–90 minutes of free time depending on post-workout buffer. For a 75-minute lift, require 85–105 minutes. The selected calendar event records both the lifting duration and the full reserved interval.

### Candidate filtering

Reject an interval when it:

- overlaps an existing event;
- starts in the early morning;
- would run past 8 PM on Wednesday, Friday, or Saturday;
- leaves insufficient recovery after a materially overlapping muscle-group workout; or
- is within a future workload blackout determined by the workload policy.

### Selection order

1. Place the three protected workouts across the week while maximizing recovery spacing.
2. Prefer the 75-minute variant where it fits; otherwise choose the 60-minute variant.
3. Use stable preferred windows when scores are otherwise equivalent, so the routine becomes predictable.
4. Add the optional fourth workout only after protected sessions have valid placements.
5. If no valid protected slot exists, surface a clear exception rather than inventing an overlap.

### Calendar-write rules

- Calendar writes are automatic only for Jarvis-generated workout events.
- Mark every created event with a stable Jarvis workout ID and ownership metadata.
- Update, reschedule, or remove only events carrying that ID.
- Preserve all other calendar events.
- Record the scheduling reason, chosen duration, and source routine for auditability.
- If a newly created conflict invalidates a Jarvis workout, attempt one safe reschedule; otherwise mark it `needs_review`.

## Workload policy roadmap

### Now

Calendar busyness alone does not remove a protected lift. The planner uses event conflicts only to find a free time window.

### Later: Canvas and workload intelligence

When Canvas is connected, ingest syllabus assignments, due dates, course commitments, and—where available—estimated effort. Combine that with Jarvis tasks into a `WorkloadForecast`.

The forecast may defer or remove a protected workout only when the effort/due-date score crosses a declared threshold. The UI must explain the cause, for example: “Deferred because two high-effort assignments are due tomorrow,” not “Calendar looked busy.”

## Data model additions

- `fitness_profiles`: goals, availability rules, scheduling permissions, and onboarding baseline.
- `training_programs`: program title, start/end date, weekly target, and version.
- `workout_templates`: 60/75-minute variants, focus, exercises, and estimated duration.
- `planned_workouts`: selected template, scheduled window, lift duration, status, calendar event reference, and scheduling rationale.
- `workout_decisions`: skip/defer/reschedule reason, actor, timestamp, and previous state.
- `workload_forecasts` (future): time-window score, source assignments/tasks, threshold result, and explanation.

## Integrations

### Hevy

Read profile units, routines, workouts, and exercise history. Use completion history to calibrate progression. Do not write a Hevy routine or plan without a user-visible preview/approval flow; automatic calendar placement does not imply automatic Hevy writes.

### Google Calendar

Read events and free intervals only. Jarvis schedules, moves, and deletes workout sessions in its private platform calendar without writing to Google Calendar.

### Canvas

Deferred. It will feed workload scoring, not workout programming directly.

## Safety and product boundaries

- This is general fitness planning, not medical, injury-rehabilitation, or nutrition treatment advice.
- Surface a prompt to seek qualified guidance for pain, new limitations, or concerning symptoms.
- Do not claim that a workout plan guarantees body-composition outcomes.
- Nutrition tracking can be considered later, but is out of scope for this fitness-page and scheduling plan.

## Implementation sequence

1. Completed: define the fitness domain types and persistence schema.
2. Completed: build the program and weekly-plan UI using deterministic preview data.
3. Completed: implement workout variants and the pure scheduling engine with unit tests for constraints, recovery, and slot selection.
4. Completed: workouts are scheduled and reconciled in Jarvis's private calendar layer; Google Calendar remains a read-only source.
5. Next: connect Hevy read data and progression signals, then add the preview-before-Hevy-write flow.
6. Later: add Canvas/task workload forecasting as a separate decision layer once Canvas is connected.

## Success criteria

- A three-session week can be generated without calendar overlaps or prohibited-time placements.
- Every scheduled session explains why its time and duration were chosen.
- An available 75-minute window receives the fuller variant; a smaller compatible window receives the 60-minute variant.
- The optional fourth workout is never placed before the three protected sessions are safely scheduled.
- Jarvis never modifies a non-Jarvis calendar event.
- A future workload-based deferral is traceable to assignments/tasks, not generic calendar density.

## Open questions for implementation

- Which days or time windows should receive a preference bonus once real calendar data is available?
- What concrete workload threshold should defer a protected session after Canvas is connected?
- Should an uncompleted workout auto-reschedule within the same week, or be treated as missed unless the user intervenes?
- What body-composition inputs, if any, should be retained beyond optional bodyweight?

## Next action

Connect Google Calendar with read-only scope and complete the first-use baseline inputs. Scheduled workouts remain Jarvis-owned platform events; no external calendar or Hevy data is changed.
