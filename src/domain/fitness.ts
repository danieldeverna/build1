import { addDays, addMinutes, set, startOfDay } from "date-fns";
import type { CalendarEvent } from "@/domain/calendar";

export type FitnessProfile = {
  goals: string[];
  experience: "beginner" | "intermediate" | "advanced";
  protectedSessions: number;
  optionalSession: boolean;
  durations: Array<60 | 75>;
  travelBeforeMinutes: number;
  bufferAfterMinutes: number;
  earliestStartHour: number;
  curfewHour: number;
  curfewDays: number[];
  priorityClassTitles: string[];
};

export type ExercisePrescription = {
  name: string;
  sets: number;
  reps: string;
  note?: string;
};

export type WorkoutTemplate = {
  id: string;
  title: string;
  focus: string;
  protected: boolean;
  variants: Record<60 | 75, ExercisePrescription[]>;
};

export type PlannedWorkoutStatus = "scheduled" | "completed" | "skipped" | "needs_review";

export type PlannedWorkout = {
  id: string;
  templateId: string;
  title: string;
  focus: string;
  protected: boolean;
  durationMinutes: 60 | 75;
  reservedStart: string;
  liftStart: string;
  liftEnd: string;
  reservedEnd: string;
  status: PlannedWorkoutStatus;
  reason: string;
  exercises: ExercisePrescription[];
  calendarEventId: string;
};

export const defaultFitnessProfile: FitnessProfile = {
  goals: ["Get leaner", "Build upper-body muscle", "Summer definition"],
  experience: "intermediate",
  protectedSessions: 3,
  optionalSession: true,
  durations: [75, 60],
  travelBeforeMinutes: 10,
  bufferAfterMinutes: 20,
  earliestStartHour: 10,
  curfewHour: 20,
  curfewDays: [3, 5, 6],
  priorityClassTitles: ["EFG", "JCIV", "Macro", "Philosophy"],
};

const push60: ExercisePrescription[] = [
  { name: "Barbell bench press", sets: 4, reps: "6–8" },
  { name: "Incline dumbbell press", sets: 3, reps: "8–10" },
  { name: "Seated shoulder press", sets: 3, reps: "8–10" },
  { name: "Cable lateral raise", sets: 3, reps: "12–15" },
  { name: "Rope triceps pressdown", sets: 3, reps: "10–12" },
];
const pull60: ExercisePrescription[] = [
  { name: "Pull-up or lat pulldown", sets: 4, reps: "6–10" },
  { name: "Chest-supported row", sets: 4, reps: "8–10" },
  { name: "Single-arm cable row", sets: 3, reps: "10–12" },
  { name: "Reverse pec deck", sets: 3, reps: "12–15" },
  { name: "Incline dumbbell curl", sets: 3, reps: "10–12" },
];
const lower60: ExercisePrescription[] = [
  { name: "Back squat", sets: 4, reps: "5–8" },
  { name: "Romanian deadlift", sets: 3, reps: "8–10" },
  { name: "Leg press", sets: 3, reps: "10–12" },
  { name: "Seated leg curl", sets: 3, reps: "10–12" },
  { name: "Cable crunch", sets: 3, reps: "12–15" },
];
const accessory60: ExercisePrescription[] = [
  { name: "Incline machine press", sets: 3, reps: "10–12" },
  { name: "Neutral-grip pulldown", sets: 3, reps: "10–12" },
  { name: "Cable lateral raise", sets: 4, reps: "12–15" },
  { name: "EZ-bar curl", sets: 3, reps: "10–12" },
  { name: "Overhead cable extension", sets: 3, reps: "10–12" },
];

const extend = (base: ExercisePrescription[], extra: ExercisePrescription): ExercisePrescription[] => [...base, extra];

export const workoutTemplates: WorkoutTemplate[] = [
  { id: "upper-push", title: "Upper Push", focus: "Chest · shoulders · triceps", protected: true, variants: { 60: push60, 75: extend(push60, { name: "Hanging knee raise", sets: 3, reps: "10–15" }) } },
  { id: "upper-pull", title: "Upper Pull", focus: "Back · rear delts · biceps", protected: true, variants: { 60: pull60, 75: extend(pull60, { name: "Hammer curl", sets: 3, reps: "10–12" }) } },
  { id: "lower-abs", title: "Lower + Abs", focus: "Legs · posterior chain · core", protected: true, variants: { 60: lower60, 75: extend(lower60, { name: "Ab wheel rollout", sets: 3, reps: "8–12" }) } },
  { id: "upper-accessory", title: "Upper Accessory", focus: "Delts · arms · upper torso", protected: false, variants: { 60: accessory60, 75: extend(accessory60, { name: "Incline treadmill walk", sets: 1, reps: "12 min", note: "Easy conversational pace" }) } },
];

function overlaps(start: Date, end: Date, event: CalendarEvent) {
  return start < new Date(event.end) && end > new Date(event.start);
}

function candidateFor(day: Date, startMinutes: number, duration: 60 | 75, profile: FitnessProfile) {
  const reservedStart = set(day, { hours: Math.floor(startMinutes / 60), minutes: startMinutes % 60, seconds: 0, milliseconds: 0 });
  const liftStart = addMinutes(reservedStart, profile.travelBeforeMinutes);
  const liftEnd = addMinutes(liftStart, duration);
  const reservedEnd = addMinutes(liftEnd, profile.bufferAfterMinutes);
  return { reservedStart, liftStart, liftEnd, reservedEnd };
}

export function scheduleFitnessWeek({
  weekStart,
  events,
  profile = defaultFitnessProfile,
  templates = workoutTemplates,
  notBefore,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  profile?: FitnessProfile;
  templates?: WorkoutTemplate[];
  notBefore?: Date;
}) {
  const scheduled: PlannedWorkout[] = [];
  const targets = [0, 2, 4, 6];
  const startMinutes = [16, 17, 15, 14, 18, 13, 12, 11, 10].map((hour) => hour * 60);
  const start = startOfDay(weekStart);
  const minimumStart = notBefore && notBefore > start ? notBefore : weekStart;
  const eligibleTemplates = templates.filter((template) => template.protected).slice(0, profile.protectedSessions);
  if (profile.optionalSession) eligibleTemplates.push(...templates.filter((template) => !template.protected).slice(0, 1));

  for (const [templateIndex, template] of eligibleTemplates.entries()) {
    if (!template.protected && scheduled.filter((item) => item.protected).length < profile.protectedSessions) break;
    const target = targets[templateIndex] ?? 6;
    const dayOffsets = Array.from({ length: 7 }, (_, index) => index).sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
    let planned: PlannedWorkout | null = null;

    for (const dayOffset of dayOffsets) {
      if (planned) break;
      const day = addDays(start, dayOffset);
      const postClassStarts = events
        .filter((event) => !event.allDay && eventOccursOnDay(event, day) && isPriorityClass(event.title, profile.priorityClassTitles))
        .map((event) => {
          const end = new Date(event.end);
          return Math.ceil((end.getHours() * 60 + end.getMinutes()) / 15) * 15;
        })
        .filter((minutes) => minutes >= profile.earliestStartHour * 60 && minutes <= 19 * 60);
      for (const minutes of [...new Set([...postClassStarts, ...startMinutes])]) {
        if (minutes < profile.earliestStartHour * 60) continue;
        for (const duration of profile.durations) {
          const candidate = candidateFor(day, minutes, duration, profile);
          if (candidate.reservedStart < minimumStart) continue;
          const hasConflict = events.some((event) => overlaps(candidate.reservedStart, candidate.reservedEnd, event));
          const recoveryConflict = scheduled.some((item) => Math.abs(candidate.liftStart.getTime() - new Date(item.liftStart).getTime()) < 36 * 60 * 60 * 1000);
          const curfewConflict = profile.curfewDays.includes(candidate.reservedStart.getDay()) && (candidate.reservedEnd.getHours() > profile.curfewHour || (candidate.reservedEnd.getHours() === profile.curfewHour && candidate.reservedEnd.getMinutes() > 0));
          if (hasConflict || recoveryConflict || curfewConflict) continue;

          planned = {
            id: `fitness-${template.id}-${start.toISOString().slice(0, 10)}`,
            templateId: template.id,
            title: template.title,
            focus: template.focus,
            protected: template.protected,
            durationMinutes: duration,
            reservedStart: candidate.reservedStart.toISOString(),
            liftStart: candidate.liftStart.toISOString(),
            liftEnd: candidate.liftEnd.toISOString(),
            reservedEnd: candidate.reservedEnd.toISOString(),
            status: "scheduled",
            reason: `${duration}-minute plan fits between commitments with recovery protected.`,
            exercises: template.variants[duration],
            calendarEventId: `jarvis-${template.id}-${start.toISOString().slice(0, 10)}`,
          };
          break;
        }
        if (planned) break;
      }
    }
    if (planned) scheduled.push(planned);
  }
  return scheduled;
}

export function plannedWorkoutToCalendarEvent(workout: PlannedWorkout): CalendarEvent {
  return {
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
  };
}

function isPriorityClass(title: string, classTitles: string[]) {
  const normalized = title.trim().toLocaleLowerCase();
  return classTitles.some((classTitle) => normalized === classTitle.toLocaleLowerCase() || normalized.startsWith(`${classTitle.toLocaleLowerCase()} `));
}

function eventOccursOnDay(event: CalendarEvent, day: Date) {
  const eventStart = new Date(event.start);
  return eventStart.getFullYear() === day.getFullYear() && eventStart.getMonth() === day.getMonth() && eventStart.getDate() === day.getDate();
}
