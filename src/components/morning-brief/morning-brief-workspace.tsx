"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, CloudSun, Dumbbell, MapPin, RefreshCw, SquareCheckBig, Sunrise } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useCalendarData } from "@/components/calendar/calendar-data-provider";
import { composeMorningBrief, dateKeyInTimeZone, formatBriefTime, MORNING_BRIEF_TIME_ZONE, type SourceSnapshot } from "@/domain/morning-brief";
import type { Task } from "@/domain/tasks";
import { formatWeatherTime, type WeatherForecast } from "@/domain/weather";
import { useCurrentTime } from "@/hooks/use-current-time";

function retainSnapshot<T>(previous: SourceSnapshot<T>, incoming: SourceSnapshot<T>): SourceSnapshot<T> {
  if (incoming.status !== "error" || previous.status === "error") return incoming;
  return { status: "stale", data: previous.data, loadedAt: previous.loadedAt, message: incoming.message };
}

function useRetainedSnapshot<T>(incoming: SourceSnapshot<T>) {
  const [state, setState] = useState({ incoming, value: incoming });
  if (state.incoming !== incoming) {
    const value = retainSnapshot(state.value, incoming);
    setState({ incoming, value });
    return value;
  }
  return state.value;
}

type RefreshState = {
  serverKey: string;
  awaiting: boolean;
  serverArrived: boolean;
  serverPartial: boolean;
  calendarReady: boolean | null;
  markStale: boolean;
  announcement: string;
};

function completedRefresh(state: RefreshState): RefreshState {
  if (!state.serverArrived || state.calendarReady === null) return state;
  const partial = state.serverPartial || !state.calendarReady;
  return { ...state, awaiting: false, markStale: false, announcement: partial ? "Brief refreshed with one or more sources unavailable. Previous useful data was retained when possible." : "Brief refreshed. Cached weather may retain the same observation for up to 15 minutes." };
}

export function MorningBriefWorkspace({ renderedAt, tasks: incomingTasks, weather: incomingWeather }: { renderedAt: string; tasks: SourceSnapshot<Task[]>; weather: SourceSnapshot<WeatherForecast> }) {
  const router = useRouter();
  const calendar = useCalendarData();
  const currentTime = useCurrentTime();
  const fallbackNow = useMemo(() => new Date(renderedAt), [renderedAt]);
  const now = currentTime ?? fallbackNow;
  const tasks = useRetainedSnapshot(incomingTasks);
  const weather = useRetainedSnapshot(incomingWeather);
  const [refreshState, setRefreshState] = useState<RefreshState>({ serverKey: renderedAt, awaiting: false, serverArrived: false, serverPartial: false, calendarReady: null, markStale: false, announcement: "" });
  const [, startTransition] = useTransition();
  const lastDateKey = useRef(dateKeyInTimeZone(now));

  let currentRefresh = refreshState;
  if (refreshState.serverKey !== renderedAt) {
    currentRefresh = completedRefresh({ ...refreshState, serverKey: renderedAt, serverArrived: true, serverPartial: incomingTasks.status === "error" || incomingWeather.status === "error", markStale: false });
    setRefreshState(currentRefresh);
  }

  const visibleTasks: SourceSnapshot<Task[]> = useMemo(() => currentRefresh.markStale && tasks.status !== "error" ? { status: "stale", data: tasks.data, loadedAt: tasks.loadedAt, message: "Refreshing for the new local day." } : tasks, [currentRefresh.markStale, tasks]);
  const visibleWeather: SourceSnapshot<WeatherForecast> = useMemo(() => currentRefresh.markStale && weather.status !== "error" ? { status: "stale", data: weather.data, loadedAt: weather.loadedAt, message: "Refreshing for the new local day." } : weather, [currentRefresh.markStale, weather]);

  const refresh = useCallback((reason: "manual" | "midnight" = "manual") => {
    if (refreshState.awaiting) return;
    setRefreshState((previous) => ({ ...previous, awaiting: true, serverArrived: false, serverPartial: false, calendarReady: null, markStale: reason === "midnight", announcement: "Refreshing tasks, calendar, and cached weather…" }));
    void calendar.refreshCalendar().then((calendarReady) => setRefreshState((previous) => completedRefresh({ ...previous, calendarReady })));
    startTransition(() => router.refresh());
  }, [calendar, refreshState.awaiting, router]);

  useEffect(() => {
    const dateKey = dateKeyInTimeZone(now);
    if (dateKey !== lastDateKey.current) {
      lastDateKey.current = dateKey;
      refresh("midnight");
    }
  }, [now, refresh]);

  const brief = useMemo(() => composeMorningBrief({ now, renderedAt, calendar: { events: calendar.events, syncState: calendar.syncState, lastSyncedAt: calendar.lastSyncedAt, connected: calendar.googleCalendarConnected }, tasks: visibleTasks, weather: visibleWeather }), [calendar.events, calendar.googleCalendarConnected, calendar.lastSyncedAt, calendar.syncState, now, renderedAt, visibleTasks, visibleWeather]);
  const localDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: MORNING_BRIEF_TIME_ZONE }).format(now);
  const busy = currentRefresh.awaiting;
  const fitnessState = brief.sources.find((source) => source.source === "fitness")?.state;

  return <>
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow mb-2 text-amber-700 dark:text-amber-300">Daily command center</p><h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.055em] sm:text-[2.15rem]"><Sunrise className="text-amber-600"/>Morning Brief</h1><p className="mt-2 text-sm text-[var(--muted)]">{localDate} · Each source reports its own freshness below.</p></div><button type="button" onClick={() => refresh()} disabled={busy} aria-busy={busy} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-70"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/>{busy ? "Refreshing…" : "Refresh brief"}</button></header>
    <p className="sr-only" aria-live="polite">{currentRefresh.announcement}</p>
    <section className="card border-amber-200 p-5 dark:border-amber-900" aria-labelledby="brief-glance"><p className="eyebrow text-amber-700 dark:text-amber-300">At a glance</p><h2 id="brief-glance" className="mt-2 text-xl font-bold tracking-[-0.035em]">{brief.headline}</h2>{brief.watchouts.length ? <ul className="mt-4 flex flex-wrap gap-2">{brief.watchouts.map((item) => <li key={item.id}><Link href={item.href ?? "/morning-brief"} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200"><AlertTriangle size={13}/>{item.label}</Link></li>)}</ul> : <p className="mt-3 text-sm text-[var(--muted)]">No immediate watchouts from the available sources.</p>}</section>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <BriefSection icon={<CalendarDays size={18}/>} eyebrow="Up next" title={brief.currentOrNextEvent?.title ?? "No more timed events today"} href="/calendar">{brief.currentOrNextEvent ? <div className="mt-3 text-sm text-[var(--muted)]"><p>{brief.currentOrNextEvent.state === "current" ? "Happening now" : `${formatBriefTime(brief.currentOrNextEvent.start)}–${formatBriefTime(brief.currentOrNextEvent.end)}`}</p>{brief.currentOrNextEvent.location && <p className="mt-1 flex items-center gap-1.5"><MapPin size={14}/>{brief.currentOrNextEvent.location}</p>}</div> : <p className="mt-3 text-sm text-[var(--muted)]">Your remaining calendar is open.</p>}</BriefSection>
        <BriefSection icon={<CalendarDays size={18}/>} eyebrow="Today’s shape" title={`${brief.metrics.commitments ?? "—"} commitments`} href="/calendar">{brief.allDayEvents.length > 0 && <ul className="mt-4 space-y-2">{brief.allDayEvents.map((event) => <li key={event.id} className="flex gap-3 text-sm"><span className="w-20 shrink-0 font-semibold text-amber-700 dark:text-amber-300">All day</span><span>{event.title}</span></li>)}</ul>}{brief.timedEvents.length ? <ol className="mt-4 space-y-3">{brief.timedEvents.map((event) => <li key={event.id} className={`flex gap-3 text-sm ${event.state === "earlier" ? "opacity-50" : ""}`}><time className="w-20 shrink-0 font-semibold tabular-nums">{formatBriefTime(event.start)}</time><span className="min-w-0"><span className="font-medium">{event.title}</span>{event.location && <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{event.location}</span>}</span></li>)}</ol> : <p className="mt-3 text-sm text-[var(--muted)]">No timed commitments today.</p>}</BriefSection>
      </div>
      <div className="space-y-4">
        <BriefSection icon={<SquareCheckBig size={18}/>} eyebrow="Priority work" title={brief.metrics.priorities === null ? "Tasks unavailable" : `${brief.metrics.priorities} priorities`} href="/work">{brief.priorityTasks.length ? <ol className="mt-4 space-y-3">{brief.priorityTasks.map((task, index) => <li key={task.id} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{index + 1}</span><span><span className="font-medium">{task.title}</span><span className="mt-0.5 block text-xs capitalize text-[var(--muted)]">{task.bucket}{task.dueDate ? ` · ${task.dueDate}` : ""}</span></span></li>)}</ol> : <p className="mt-3 text-sm text-[var(--muted)]">{brief.metrics.priorities === null ? "Work remains accessible while Jarvis retries this source." : "No urgent or upcoming tasks."}</p>}</BriefSection>
        <BriefSection icon={<Dumbbell size={18}/>} eyebrow="Movement" title={brief.workout?.title ?? (fitnessState === "empty" ? "No workout scheduled today" : fitnessState === "syncing" ? "Workout schedule syncing" : fitnessState === "preview" ? "Preview workout schedule" : "Workout schedule unknown")} href="/fitness">{brief.workout ? <p className="mt-3 text-sm text-[var(--muted)]">{brief.workout.timing === "today" ? "Today" : "Next seven days"} · {formatBriefTime(brief.workout.start)}–{formatBriefTime(brief.workout.end)}<span className="mt-1 block">{brief.workout.confidence === "jarvis-local-only" ? "Local Jarvis schedule · Google unavailable" : brief.workout.confidence === "preview" ? "Preview schedule" : brief.workout.confidence === "calendar-stale" ? "Last synced calendar · may be stale" : "Calendar live"}</span></p> : <p className="mt-3 text-sm text-[var(--muted)]">{fitnessState === "empty" ? "Open Fitness to plan a session." : "Connect or refresh Calendar before treating the day as open."}</p>}</BriefSection>
        <BriefSection icon={<CloudSun size={18}/>} eyebrow="Conditions" title={brief.weather ? `${Math.round(brief.weather.temperature)}° · ${brief.weather.condition}` : "Live conditions unavailable"} href="/weather">{brief.weather ? <p className="mt-3 text-sm text-[var(--muted)]">H {Math.round(brief.weather.high)}° / L {Math.round(brief.weather.low)}°{Math.abs(brief.weather.feelsLike - brief.weather.temperature) >= 3 ? ` · Feels like ${Math.round(brief.weather.feelsLike)}°` : ""}<span className="mt-1 block">{brief.weather.nextSixHoursPrecipitationMax}% rain chance · Observed {formatWeatherTime(brief.weather.observedAt)}</span></p> : <p className="mt-3 text-sm text-[var(--muted)]">Weather trouble does not hide the rest of your brief.</p>}</BriefSection>
      </div>
    </div>
    <section className="card mt-4 p-5" aria-labelledby="source-status"><h2 id="source-status" className="text-sm font-bold">Source status</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{brief.sources.map((source) => <li key={source.source} className="flex items-start gap-2 text-xs text-[var(--muted)]">{["ready", "empty"].includes(source.state) ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600"/> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600"/>}<span><strong className="block capitalize text-[var(--foreground)]">{source.source}</strong>{source.label}{source.updatedAt && <span className="block">Updated {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: MORNING_BRIEF_TIME_ZONE }).format(new Date(source.updatedAt))}</span>}</span></li>)}</ul></section>
  </>;
}

function BriefSection({ icon, eyebrow, title, href, children }: { icon: React.ReactNode; eyebrow: string; title: string; href: string; children: React.ReactNode }) {
  return <section className="card p-5"><div className="flex items-start justify-between gap-3"><div><span className="mb-3 grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{icon}</span><p className="eyebrow">{eyebrow}</p><h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">{title}</h2></div><Link href={href} className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-[var(--accent)]">Open</Link></div>{children}</section>;
}
