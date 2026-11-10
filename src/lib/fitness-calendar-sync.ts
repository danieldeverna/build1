import { addMinutes, startOfWeek } from "date-fns";
import type { CalendarEvent } from "@/domain/calendar";
import { defaultFitnessProfile, scheduleFitnessWeek, workoutTemplates, type PlannedWorkout } from "@/domain/fitness";
import { addLocalEvent, mergeCalendarEvents, readCalendarOverlay, saveCalendarOverlay, type CalendarOverlay } from "@/lib/calendar-overlay";

function overlaps(left: CalendarEvent, right: CalendarEvent) {
  return new Date(left.start) < new Date(right.end) && new Date(left.end) > new Date(right.start);
}

function workoutFromEvent(event: CalendarEvent): PlannedWorkout | null {
  const template = workoutTemplates.find((candidate) => event.automationId?.startsWith(`fitness-${candidate.id}-`));
  if (!template || !event.automationId) return null;
  const reservedStart = new Date(event.start);
  const reservedEnd = new Date(event.end);
  const reservedMinutes = (reservedEnd.getTime() - reservedStart.getTime()) / 60_000;
  const durationMinutes = reservedMinutes - defaultFitnessProfile.travelBeforeMinutes - defaultFitnessProfile.bufferAfterMinutes;
  if (durationMinutes !== 60 && durationMinutes !== 75) return null;
  const liftStart = addMinutes(reservedStart, defaultFitnessProfile.travelBeforeMinutes);
  const liftEnd = addMinutes(liftStart, durationMinutes);
  return {
    id: event.automationId,
    templateId: template.id,
    title: template.title,
    focus: template.focus,
    protected: template.protected,
    durationMinutes,
    reservedStart: event.start,
    liftStart: liftStart.toISOString(),
    liftEnd: liftEnd.toISOString(),
    reservedEnd: event.end,
    status: "scheduled",
    reason: "Kept your latest Jarvis calendar adjustment.",
    exercises: template.variants[durationMinutes],
    calendarEventId: event.id,
  };
}

export type FitnessCalendarReconciliation = {
  overlay: CalendarOverlay;
  events: CalendarEvent[];
  plan: PlannedWorkout[];
  changed: boolean;
};

/** Keeps workouts in Jarvis's local calendar; this never writes to Google Calendar. */
export function reconcileFitnessCalendar(providerEvents: CalendarEvent[], now = new Date()): FitnessCalendarReconciliation {
  const overlay = readCalendarOverlay();
  const combined = mergeCalendarEvents(providerEvents, overlay);
  const existingWorkouts = overlay.events.filter((event) => event.automationType === "workout");
  const commitments = combined.filter((event) => event.automationType !== "workout");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const planned = scheduleFitnessWeek({ weekStart, events: commitments, profile: defaultFitnessProfile, notBefore: now });
  const hasConflict = existingWorkouts.some((workout) => commitments.some((commitment) => overlaps(workout, commitment)));

  if (existingWorkouts.length > 0 && !hasConflict) {
    const preserved = existingWorkouts.map(workoutFromEvent).filter((workout): workout is PlannedWorkout => Boolean(workout));
    return { overlay, events: combined, plan: preserved.length ? preserved : planned, changed: false };
  }

  let nextOverlay: CalendarOverlay = { ...overlay, events: overlay.events.filter((event) => event.automationType !== "workout") };
  for (const workout of planned) {
    if (nextOverlay.deletedIds.includes(workout.calendarEventId)) continue;
    nextOverlay = addLocalEvent({
      id: workout.calendarEventId,
      title: `Workout · ${workout.title}`,
      start: workout.reservedStart,
      end: workout.reservedEnd,
      allDay: false,
      source: "jarvis",
      location: "University gym",
      automationId: workout.id,
      automationType: "workout",
      color: "emerald",
    }, nextOverlay);
  }
  saveCalendarOverlay(nextOverlay);
  return { overlay: nextOverlay, events: mergeCalendarEvents(providerEvents, nextOverlay), plan: planned.filter((workout) => !nextOverlay.deletedIds.includes(workout.calendarEventId)), changed: true };
}
