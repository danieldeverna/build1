import { describe, expect, it } from "vitest";
import { composeMorningBrief, type MorningBriefInputs, type SourceSnapshot } from "@/domain/morning-brief";
import type { CalendarEvent } from "@/domain/calendar";
import type { Task } from "@/domain/tasks";
import type { WeatherForecast } from "@/domain/weather";

const NOW = new Date("2026-11-11T15:00:00.000Z");
const loadedAt = NOW.toISOString();

function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "start" | "end">): CalendarEvent {
  return { allDay: false, source: "google", color: "blue", ...overrides };
}

function task(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return { category: "projects", status: "open", dueDate: null, priority: null, estimatedMinutes: null, notes: null, source: "build1", ...overrides };
}

function weather(precipitationChance = 20): WeatherForecast {
  return { location: "Georgetown, D.C.", latitude: 0, longitude: 0, timezone: "America/New_York", current: { observedAt: "2026-11-11T10:00", temperature: 63, feelsLike: 62, humidity: 50, precipitation: 0, weatherCode: 2, cloudCover: 30, pressure: 1000, windSpeed: 5, windDirection: 90, windGusts: 8, uvIndex: 2 }, hourly: Array.from({ length: 6 }, (_, index) => ({ time: `2026-11-11T${10 + index}:00`, temperature: 63, feelsLike: 62, precipitationChance, weatherCode: 2, uvIndex: 2, windSpeed: 5, humidity: 50 })), daily: [{ date: "2026-11-11", weatherCode: 2, high: 68, low: 51, feelsLikeHigh: 68, feelsLikeLow: 50, precipitationChance, uvIndex: 2, sunrise: "2026-11-11T06:45", sunset: "2026-11-11T16:55", windSpeed: 8 }] };
}

function inputs(overrides: Partial<MorningBriefInputs> = {}): MorningBriefInputs {
  return { now: NOW, renderedAt: loadedAt, calendar: { events: [], syncState: "live", lastSyncedAt: loadedAt, connected: true }, tasks: { status: "ready", data: [], loadedAt }, weather: { status: "ready", data: weather(), loadedAt }, ...overrides };
}

describe("composeMorningBrief", () => {
  it("prefers a current event and never selects tomorrow after today's schedule ends", () => {
    const current = event({ id: "current", title: "Current", start: "2026-11-11T14:30:00Z", end: "2026-11-11T15:30:00Z" });
    const future = event({ id: "future", title: "Future", start: "2026-11-11T16:00:00Z", end: "2026-11-11T17:00:00Z" });
    expect(composeMorningBrief(inputs({ calendar: { ...inputs().calendar, events: [future, current] } })).currentOrNextEvent?.id).toBe("current");
    const late = composeMorningBrief(inputs({ now: new Date("2026-11-12T04:30:00Z"), calendar: { ...inputs().calendar, events: [future, event({ id: "tomorrow", title: "Tomorrow", start: "2026-11-12T15:00:00Z", end: "2026-11-12T16:00:00Z" })] } }));
    expect(late.currentOrNextEvent).toBeNull();
  });

  it("includes overnight intersections and honors exclusive all-day end dates", () => {
    const overnight = event({ id: "overnight", title: "Overnight", start: "2026-11-11T03:00:00Z", end: "2026-11-11T06:00:00Z" });
    const allDay = event({ id: "all-day", title: "Conference", start: "2026-11-10", end: "2026-11-12", allDay: true });
    const endedAllDay = event({ id: "ended", title: "Ended", start: "2026-11-10", end: "2026-11-11", allDay: true });
    const model = composeMorningBrief(inputs({ calendar: { ...inputs().calendar, events: [overnight, allDay, endedAllDay] } }));
    expect(model.timedEvents.map((item) => item.id)).toContain("overnight");
    expect(model.allDayEvents.map((item) => item.id)).toEqual(["all-day"]);
  });

  it("excludes Canvas while keeping Google, Jarvis, and workout commitments", () => {
    const events = [
      event({ id: "google", title: "Class", start: "2026-11-11T16:00:00Z", end: "2026-11-11T17:00:00Z" }),
      event({ id: "jarvis", title: "Lift", start: "2026-11-11T22:00:00Z", end: "2026-11-11T23:00:00Z", source: "jarvis", automationType: "workout" }),
      event({ id: "canvas", title: "Canvas", start: "2026-11-11T18:00:00Z", end: "2026-11-11T19:00:00Z", source: "canvas" }),
    ];
    const model = composeMorningBrief(inputs({ calendar: { ...inputs().calendar, events } }));
    expect(model.metrics.commitments).toBe(2);
    expect(model.workout?.eventId).toBe("jarvis");
    expect(model.timedEvents.map((item) => item.id)).not.toContain("canvas");
  });

  it("ranks tasks by exclusive bucket and does not treat undated work as overdue", () => {
    const tasks = [task({ id: "later", title: "Later", priority: "low" }), task({ id: "high", title: "High", priority: "high" }), task({ id: "today", title: "Today", dueDate: "2026-11-11", priority: "low" }), task({ id: "overdue", title: "Overdue", dueDate: "2026-11-10" }), task({ id: "upcoming", title: "Upcoming", dueDate: "2026-11-14" })];
    const model = composeMorningBrief(inputs({ tasks: { status: "ready", data: tasks, loadedAt } }));
    expect(model.priorityTasks.map((item) => item.id)).toEqual(["overdue", "today", "high", "upcoming"]);
    expect(model.metrics.priorities).toBe(3);
    expect(model.watchouts.find((item) => item.category === "work")?.label).toBe("1 overdue task");
  });

  it("detects overlaps before near-term starts", () => {
    const events = [event({ id: "a", title: "A", start: "2026-11-11T15:30:00Z", end: "2026-11-11T16:30:00Z" }), event({ id: "b", title: "B", start: "2026-11-11T16:00:00Z", end: "2026-11-11T17:00:00Z" })];
    const model = composeMorningBrief(inputs({ calendar: { ...inputs().calendar, events } }));
    expect(model.watchouts.find((item) => item.category === "schedule")?.id).toBe("schedule-conflict");
  });

  it("adds a weather watchout at 50 percent but not 49 percent", () => {
    const snapshot = (chance: number): SourceSnapshot<WeatherForecast> => ({ status: "ready", data: weather(chance), loadedAt });
    expect(composeMorningBrief(inputs({ weather: snapshot(49) })).watchouts.some((item) => item.category === "weather")).toBe(false);
    expect(composeMorningBrief(inputs({ weather: snapshot(50) })).watchouts.some((item) => item.category === "weather")).toBe(true);
  });

  it("does not turn failed sources into false zero metrics", () => {
    const model = composeMorningBrief(inputs({ calendar: { events: [], syncState: "error", lastSyncedAt: null, connected: true }, tasks: { status: "error", data: null, attemptedAt: loadedAt, message: "down" }, weather: { status: "error", data: null, attemptedAt: loadedAt, message: "down" } }));
    expect(model.metrics).toEqual({ commitments: null, priorities: null });
    expect(model.headline).toBe("Brief temporarily incomplete.");
    expect(model.watchouts[0]).toMatchObject({ category: "source", severity: "error" });
  });

  it("uses calendar preview labels without claiming live data", () => {
    const model = composeMorningBrief(inputs({ calendar: { events: [], syncState: "preview", lastSyncedAt: null, connected: false } }));
    expect(model.sources.find((source) => source.source === "calendar")).toMatchObject({ state: "preview", label: "Calendar preview" });
    expect(model.sources.find((source) => source.source === "fitness")).toMatchObject({ state: "preview", label: "Fitness preview" });
  });

  it("finds the next workout within seven days and preserves stale Google provenance", () => {
    const nextWorkout = event({ id: "next-workout", title: "Upper Push", start: "2026-11-14T22:00:00Z", end: "2026-11-14T23:00:00Z", automationType: "workout" });
    const model = composeMorningBrief(inputs({ calendar: { events: [nextWorkout], syncState: "error", lastSyncedAt: loadedAt, connected: true } }));
    expect(model.workout).toMatchObject({ eventId: "next-workout", timing: "next-seven-days", confidence: "calendar-stale" });
    expect(model.sources.find((source) => source.source === "fitness")?.state).toBe("stale");
  });

  it("excludes completed and archived tasks defensively", () => {
    const data = [task({ id: "open", title: "Open", dueDate: "2026-11-11" }), task({ id: "done", title: "Done", dueDate: "2026-11-10", status: "completed" }), task({ id: "archived", title: "Archived", dueDate: "2026-11-10", status: "archived" })];
    const model = composeMorningBrief(inputs({ tasks: { status: "ready", data, loadedAt } }));
    expect(model.priorityTasks.map((item) => item.id)).toEqual(["open"]);
    expect(model.metrics.priorities).toBe(1);
  });

  it("uses Georgetown day bounds across spring and fall DST transitions", () => {
    const spring = composeMorningBrief(inputs({ now: new Date("2026-03-08T16:00:00Z"), calendar: { ...inputs().calendar, events: [event({ id: "spring-in", title: "Late spring day", start: "2026-03-09T03:30:00Z", end: "2026-03-09T03:45:00Z" }), event({ id: "spring-out", title: "Tomorrow", start: "2026-03-09T04:30:00Z", end: "2026-03-09T05:00:00Z" })] } }));
    expect(spring.timedEvents.map((item) => item.id)).toEqual(["spring-in"]);
    const fall = composeMorningBrief(inputs({ now: new Date("2026-11-01T17:00:00Z"), calendar: { ...inputs().calendar, events: [event({ id: "fall-in", title: "Late fall day", start: "2026-11-02T04:30:00Z", end: "2026-11-02T04:45:00Z" })] } }));
    expect(fall.timedEvents.map((item) => item.id)).toEqual(["fall-in"]);
  });

  it("orders watchouts by category and caps them at three", () => {
    const events = [event({ id: "a", title: "A", start: "2026-11-11T15:30:00Z", end: "2026-11-11T16:30:00Z" }), event({ id: "b", title: "B", start: "2026-11-11T16:00:00Z", end: "2026-11-11T17:00:00Z" })];
    const model = composeMorningBrief(inputs({ calendar: { events, syncState: "preview", lastSyncedAt: null, connected: false }, tasks: { status: "ready", data: [task({ id: "late", title: "Late", dueDate: "2026-11-10" })], loadedAt }, weather: { status: "ready", data: weather(80), loadedAt } }));
    expect(model.watchouts).toHaveLength(3);
    expect(model.watchouts.map((item) => item.category)).toEqual(["source", "schedule", "work"]);
  });
});
