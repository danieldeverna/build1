import { describe, expect, it } from "vitest";
import { defaultFitnessProfile, plannedWorkoutToCalendarEvent, scheduleFitnessWeek, workoutTemplates } from "@/domain/fitness";
import type { CalendarEvent } from "@/domain/calendar";

const monday = new Date(2026, 10, 9, 0, 0, 0, 0);

describe("fitness scheduling", () => {
  it("places three protected workouts before an optional fourth", () => {
    const plan = scheduleFitnessWeek({ weekStart: monday, events: [] });
    expect(plan).toHaveLength(4);
    expect(plan.slice(0, 3).every((item) => item.protected)).toBe(true);
    expect(plan[3].protected).toBe(false);
  });

  it("never overlaps existing commitments", () => {
    const event: CalendarEvent = { id: "class", title: "Class", start: new Date(2026, 10, 9, 16, 0).toISOString(), end: new Date(2026, 10, 9, 18, 0).toISOString(), allDay: false, source: "google", color: "violet" };
    const plan = scheduleFitnessWeek({ weekStart: monday, events: [event] });
    for (const workout of plan) {
      expect(new Date(workout.reservedStart) < new Date(event.end) && new Date(workout.reservedEnd) > new Date(event.start)).toBe(false);
    }
  });

  it("never schedules a workout before the planning instant", () => {
    const planningTime = new Date(2026, 10, 9, 16, 30, 0, 0);
    const [workout] = scheduleFitnessWeek({ weekStart: planningTime, events: [], templates: [workoutTemplates[0]] });
    expect(new Date(workout.reservedStart).getTime()).toBeGreaterThanOrEqual(planningTime.getTime());
  });

  it("uses a supplied current-time boundary instead of filling past slots", () => {
    const planningTime = new Date(2026, 10, 10, 14, 30, 0, 0);
    const plan = scheduleFitnessWeek({ weekStart: monday, events: [], templates: [workoutTemplates[0]], notBefore: planningTime });
    expect(new Date(plan[0].reservedStart).getTime()).toBeGreaterThanOrEqual(planningTime.getTime());
  });

  it("uses the 60-minute variant when a 75-minute slot would collide", () => {
    const event: CalendarEvent = { id: "evening", title: "Evening commitment", start: new Date(2026, 10, 9, 17, 30).toISOString(), end: new Date(2026, 10, 9, 20, 0).toISOString(), allDay: false, source: "google", color: "blue" };
    const profile = { ...defaultFitnessProfile, durations: [75, 60] as Array<75 | 60> };
    const plan = scheduleFitnessWeek({ weekStart: monday, events: [event], profile, templates: [workoutTemplates[0]] });
    expect(plan[0].durationMinutes).toBe(60);
  });

  it("keeps restricted-day sessions within the 8 PM curfew", () => {
    const plan = scheduleFitnessWeek({ weekStart: monday, events: [] });
    for (const workout of plan) {
      const end = new Date(workout.reservedEnd);
      if ([3, 5, 6].includes(end.getDay())) expect(end.getHours()).toBeLessThanOrEqual(20);
    }
  });

  it("creates an owned Jarvis calendar event", () => {
    const [workout] = scheduleFitnessWeek({ weekStart: monday, events: [], templates: [workoutTemplates[0]] });
    const event = plannedWorkoutToCalendarEvent(workout);
    expect(event.source).toBe("jarvis");
    expect(event.id).toBe(workout.calendarEventId);
    expect(event.title).toContain("Upper Push");
    expect(event.automationType).toBe("workout");
  });

  it("prioritizes an available slot immediately after a recognized class", () => {
    const classEvent: CalendarEvent = { id: "efg", title: "EFG", start: new Date(2026, 10, 9, 11, 0).toISOString(), end: new Date(2026, 10, 9, 13, 15).toISOString(), allDay: false, source: "google", color: "violet" };
    const [workout] = scheduleFitnessWeek({ weekStart: monday, events: [classEvent], templates: [workoutTemplates[0]] });
    expect(new Date(workout.reservedStart).getHours()).toBe(13);
    expect(new Date(workout.reservedStart).getMinutes()).toBe(15);
  });
});
