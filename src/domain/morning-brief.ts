import { addDays, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { CalendarEvent } from "@/domain/calendar";
import type { Task, TaskCategory, TaskPriority } from "@/domain/tasks";
import { weatherCodeInfo, type WeatherForecast } from "@/domain/weather";

export const MORNING_BRIEF_TIME_ZONE = "America/New_York";

export type SourceSnapshot<T> =
  | { status: "ready"; data: T; loadedAt: string }
  | { status: "stale"; data: T; loadedAt: string; message: string }
  | { status: "error"; data: null; attemptedAt: string; message: string };

export type CalendarBriefInput = {
  events: CalendarEvent[];
  syncState: "preview" | "syncing" | "live" | "error";
  lastSyncedAt: string | null;
  connected: boolean;
};

export type BriefEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "google" | "jarvis";
  location: string | null;
  workout: boolean;
} & ({ allDay: true; state: "all-day" } | { allDay: false; state: "earlier" | "current" | "upcoming" });

export type BriefTask = {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string | null;
  priority: TaskPriority | null;
  bucket: "overdue" | "today" | "high" | "upcoming" | "later";
};

export type BriefWorkout = {
  eventId: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  timing: "today" | "next-seven-days";
  confidence: "calendar-live" | "calendar-stale" | "jarvis-local-only" | "preview";
};

export type BriefWeather = {
  condition: string;
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  nextSixHoursPrecipitationMax: number;
  observedAt: string;
};

export type BriefWatchout = {
  id: string;
  category: "source" | "schedule" | "work" | "weather";
  severity: "info" | "warning" | "error";
  label: string;
  href: string | null;
};

export type BriefSourceStatus = {
  source: "calendar" | "tasks" | "weather" | "fitness";
  state: "ready" | "empty" | "syncing" | "preview" | "stale" | "error";
  label: string;
  updatedAt: string | null;
};

export type MorningBriefModel = {
  dateKey: string;
  evaluatedAt: string;
  headline: string;
  metrics: { commitments: number | null; priorities: number | null };
  currentOrNextEvent: BriefEvent | null;
  allDayEvents: BriefEvent[];
  timedEvents: BriefEvent[];
  priorityTasks: BriefTask[];
  workout: BriefWorkout | null;
  weather: BriefWeather | null;
  watchouts: BriefWatchout[];
  sources: BriefSourceStatus[];
};

export type MorningBriefInputs = {
  now: Date;
  renderedAt: string;
  timeZone?: string;
  calendar: CalendarBriefInput;
  tasks: SourceSnapshot<Task[]>;
  weather: SourceSnapshot<WeatherForecast>;
};

const bucketRank = { overdue: 0, today: 1, high: 2, upcoming: 3, later: 4 } as const;
const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

function localDateKey(date: Date, timeZone: string) {
  return format(toZonedTime(date, timeZone), "yyyy-MM-dd");
}

function dayBounds(now: Date, timeZone: string) {
  const zoned = toZonedTime(now, timeZone);
  const dateKey = format(zoned, "yyyy-MM-dd");
  const nextDateKey = format(addDays(zoned, 1), "yyyy-MM-dd");
  return {
    dateKey,
    todayStart: fromZonedTime(`${dateKey}T00:00:00`, timeZone),
    tomorrowStart: fromZonedTime(`${nextDateKey}T00:00:00`, timeZone),
  };
}

function taskBucket(task: Task, dateKey: string, sevenDayKey: string): BriefTask["bucket"] {
  if (task.dueDate && task.dueDate < dateKey) return "overdue";
  if (task.dueDate === dateKey) return "today";
  if (task.priority === "high") return "high";
  if (task.dueDate && task.dueDate <= sevenDayKey) return "upcoming";
  return "later";
}

function calendarSource(calendar: CalendarBriefInput): BriefSourceStatus {
  if (calendar.syncState === "preview") return { source: "calendar", state: "preview", label: "Calendar preview", updatedAt: null };
  if (calendar.syncState === "syncing" && !calendar.lastSyncedAt) return { source: "calendar", state: "syncing", label: "Calendar syncing", updatedAt: null };
  if (calendar.syncState === "error" && calendar.lastSyncedAt) return { source: "calendar", state: "stale", label: "Calendar may be stale", updatedAt: calendar.lastSyncedAt };
  if (calendar.syncState === "error") return { source: "calendar", state: "error", label: "Calendar unavailable", updatedAt: null };
  return { source: "calendar", state: calendar.events.length ? "ready" : "empty", label: calendar.events.length ? "Calendar live" : "Calendar live · no events", updatedAt: calendar.lastSyncedAt };
}

function snapshotSource<T>(source: "tasks" | "weather", snapshot: SourceSnapshot<T>, empty: boolean): BriefSourceStatus {
  if (snapshot.status === "error") return { source, state: "error", label: `${source === "tasks" ? "Tasks" : "Weather"} unavailable`, updatedAt: null };
  if (snapshot.status === "stale") return { source, state: "stale", label: `${source === "tasks" ? "Tasks" : "Weather"} may be stale`, updatedAt: snapshot.loadedAt };
  return { source, state: empty ? "empty" : "ready", label: empty ? "No open tasks" : `${source === "tasks" ? "Tasks" : "Weather"} current`, updatedAt: snapshot.loadedAt };
}

export function composeMorningBrief(inputs: MorningBriefInputs): MorningBriefModel {
  const timeZone = inputs.timeZone ?? MORNING_BRIEF_TIME_ZONE;
  const { dateKey, todayStart, tomorrowStart } = dayBounds(inputs.now, timeZone);
  const sevenDayKey = format(addDays(toZonedTime(inputs.now, timeZone), 7), "yyyy-MM-dd");
  const eligible = inputs.calendar.events.filter((event) => {
    if (event.source === "canvas") return false;
    if (event.allDay) return event.start.slice(0, 10) <= dateKey && dateKey < event.end.slice(0, 10);
    return new Date(event.start) < tomorrowStart && new Date(event.end) > todayStart;
  });
  const eventBase = (event: CalendarEvent) => ({ id: event.id, title: event.title, start: event.start, end: event.end, source: event.source as "google" | "jarvis", location: event.location ?? null, workout: event.automationType === "workout" });
  const allDayEvents: BriefEvent[] = eligible.filter((event) => event.allDay).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)).map((event) => ({ ...eventBase(event), allDay: true, state: "all-day" }));
  const timedEvents: BriefEvent[] = eligible.filter((event) => !event.allDay).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime() || a.id.localeCompare(b.id)).map((event) => ({
    ...eventBase(event), allDay: false,
    state: new Date(event.end) <= inputs.now ? "earlier" : new Date(event.start) <= inputs.now ? "current" : "upcoming",
  }));
  const currentOrNextEvent = timedEvents.find((event) => new Date(event.end) > inputs.now) ?? null;

  const openTasks = inputs.tasks.status === "error" ? null : inputs.tasks.data.filter((task) => task.status === "open");
  const rankedTasks = (openTasks ?? []).map((task): BriefTask => ({ id: task.id, title: task.title, category: task.category, dueDate: task.dueDate, priority: task.priority, bucket: taskBucket(task, dateKey, sevenDayKey) })).sort((a, b) => {
    return bucketRank[a.bucket] - bucketRank[b.bucket]
      || (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31")
      || (a.priority ? priorityRank[a.priority] : 3) - (b.priority ? priorityRank[b.priority] : 3)
      || a.title.trim().toLocaleLowerCase().localeCompare(b.title.trim().toLocaleLowerCase())
      || a.id.localeCompare(b.id);
  });
  const metricTasks = rankedTasks.filter((task) => ["overdue", "today", "high"].includes(task.bucket));
  const priorityTasks = [...metricTasks, ...rankedTasks.filter((task) => task.bucket === "upcoming")].slice(0, 6);

  const workoutEvents = inputs.calendar.events.filter((event) => event.source !== "canvas" && event.automationType === "workout" && !event.allDay && new Date(event.end) > todayStart && new Date(event.start) < fromZonedTime(`${format(addDays(toZonedTime(inputs.now, timeZone), 8), "yyyy-MM-dd")}T00:00:00`, timeZone)).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const workoutEvent = workoutEvents.find((event) => eligible.some((candidate) => candidate.id === event.id)) ?? workoutEvents.find((event) => new Date(event.start) >= tomorrowStart) ?? null;
  const workout: BriefWorkout | null = workoutEvent ? {
    eventId: workoutEvent.id, title: workoutEvent.title, start: workoutEvent.start, end: workoutEvent.end, location: workoutEvent.location ?? null,
    timing: eligible.some((candidate) => candidate.id === workoutEvent.id) ? "today" : "next-seven-days",
    confidence: inputs.calendar.syncState === "preview" ? "preview" : inputs.calendar.syncState === "live" ? "calendar-live" : workoutEvent.source === "jarvis" ? "jarvis-local-only" : "calendar-stale",
  } : null;

  const forecast = inputs.weather.status === "error" ? null : inputs.weather.data;
  const weather: BriefWeather | null = forecast ? {
    condition: weatherCodeInfo(forecast.current.weatherCode).label, temperature: forecast.current.temperature, feelsLike: forecast.current.feelsLike,
    high: forecast.daily[0]?.high ?? forecast.current.temperature, low: forecast.daily[0]?.low ?? forecast.current.temperature,
    nextSixHoursPrecipitationMax: Math.max(0, ...forecast.hourly.slice(0, 6).map((hour) => hour.precipitationChance)), observedAt: forecast.current.observedAt,
  } : null;

  const fitnessSource: BriefSourceStatus = (() => {
    if (workout?.confidence === "jarvis-local-only") return { source: "fitness", state: "ready", label: "Fitness local Jarvis schedule", updatedAt: null };
    if (workout?.confidence === "preview" || inputs.calendar.syncState === "preview") return { source: "fitness", state: "preview", label: "Fitness preview", updatedAt: null };
    if (workout?.confidence === "calendar-stale" || (inputs.calendar.syncState === "error" && inputs.calendar.lastSyncedAt)) return { source: "fitness", state: "stale", label: "Fitness schedule may be stale", updatedAt: inputs.calendar.lastSyncedAt };
    if (inputs.calendar.syncState === "syncing" && !inputs.calendar.lastSyncedAt) return { source: "fitness", state: "syncing", label: "Fitness schedule syncing", updatedAt: null };
    if (inputs.calendar.syncState === "error") return { source: "fitness", state: "error", label: "Fitness schedule unknown", updatedAt: null };
    return { source: "fitness", state: workout ? "ready" : "empty", label: workout ? "Fitness schedule ready" : "No workout scheduled today", updatedAt: inputs.calendar.lastSyncedAt };
  })();

  const sources: BriefSourceStatus[] = [
    calendarSource(inputs.calendar),
    snapshotSource("tasks", inputs.tasks, openTasks?.length === 0),
    snapshotSource("weather", inputs.weather, false),
    fitnessSource,
  ];

  const watchouts: BriefWatchout[] = [];
  const troubleRank = { error: 0, stale: 1, syncing: 2, preview: 3 } as const;
  const troubled = sources.filter((source): source is BriefSourceStatus & { state: keyof typeof troubleRank } => source.state in troubleRank).sort((a, b) => troubleRank[a.state] - troubleRank[b.state]);
  if (troubled.length) watchouts.push({ id: "source", category: "source", severity: troubled.some((source) => source.state === "error") ? "error" : "info", label: troubled.map((source) => source.label).join(" · "), href: "/settings" });
  const conflict = timedEvents.find((event, index) => timedEvents.slice(index + 1).some((other) => new Date(other.start) < new Date(event.end) && new Date(other.end) > new Date(event.start)));
  if (conflict) watchouts.push({ id: "schedule-conflict", category: "schedule", severity: "warning", label: `Schedule overlap near ${formatBriefTime(conflict.start, timeZone)}`, href: "/calendar" });
  else if (currentOrNextEvent && currentOrNextEvent.state === "upcoming" && new Date(currentOrNextEvent.start).getTime() - inputs.now.getTime() <= 60 * 60 * 1000) watchouts.push({ id: "schedule-next", category: "schedule", severity: "info", label: `${currentOrNextEvent.title} starts within the hour`, href: "/calendar" });
  const overdue = rankedTasks.filter((task) => task.bucket === "overdue").length;
  if (overdue) watchouts.push({ id: "work-overdue", category: "work", severity: "warning", label: `${overdue} overdue ${overdue === 1 ? "task" : "tasks"}`, href: "/work" });
  if (weather && weather.nextSixHoursPrecipitationMax >= 50) watchouts.push({ id: "weather-rain", category: "weather", severity: "info", label: `${weather.nextSixHoursPrecipitationMax}% rain chance in the next six hours`, href: "/weather" });

  const commitments = inputs.calendar.syncState === "error" && !inputs.calendar.lastSyncedAt && eligible.length === 0 ? null : eligible.length;
  const priorities = openTasks === null ? null : metricTasks.length;
  const facts = [commitments === null ? null : `${commitments} ${commitments === 1 ? "commitment" : "commitments"}`, priorities === null ? null : `${priorities} ${priorities === 1 ? "priority" : "priorities"}`].filter(Boolean);
  let headline = facts.length ? `${facts.join(", ")}${workout?.timing === "today" ? `, and a workout at ${formatBriefTime(workout.start, timeZone)}` : ""}.` : "Brief temporarily incomplete.";
  if (inputs.calendar.syncState === "syncing" && !inputs.calendar.lastSyncedAt) headline = `Calendar is syncing.${priorities === null ? "" : ` ${priorities} work ${priorities === 1 ? "priority is" : "priorities are"} ready.`}`;

  return { dateKey, evaluatedAt: inputs.now.toISOString(), headline, metrics: { commitments, priorities }, currentOrNextEvent, allDayEvents, timedEvents, priorityTasks, workout, weather, watchouts: watchouts.slice(0, 3), sources };
}

export function formatBriefTime(value: string, timeZone = MORNING_BRIEF_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(value));
}

export function dateKeyInTimeZone(date: Date, timeZone = MORNING_BRIEF_TIME_ZONE) {
  return localDateKey(date, timeZone);
}
