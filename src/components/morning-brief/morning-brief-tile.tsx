"use client";

import { ArrowUpRight, Sunrise } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCalendarData } from "@/components/calendar/calendar-data-provider";
import { composeMorningBrief, formatBriefTime, type SourceSnapshot } from "@/domain/morning-brief";
import type { Task } from "@/domain/tasks";
import type { WeatherForecast } from "@/domain/weather";
import { useCurrentTime } from "@/hooks/use-current-time";

export function MorningBriefTile({ renderedAt, tasks, weather }: { renderedAt: string; tasks: SourceSnapshot<Task[]>; weather: SourceSnapshot<WeatherForecast> }) {
  const calendar = useCalendarData();
  const currentTime = useCurrentTime();
  const fallbackNow = useMemo(() => new Date(renderedAt), [renderedAt]);
  const now = currentTime ?? fallbackNow;
  const brief = useMemo(() => composeMorningBrief({ now, renderedAt, calendar: { events: calendar.events, syncState: calendar.syncState, lastSyncedAt: calendar.lastSyncedAt, connected: calendar.googleCalendarConnected }, tasks, weather }), [calendar.events, calendar.googleCalendarConnected, calendar.lastSyncedAt, calendar.syncState, now, renderedAt, tasks, weather]);
  const metric = brief.metrics.commitments === null || brief.metrics.priorities === null ? "Sources are still updating" : `${brief.metrics.commitments} commitments · ${brief.metrics.priorities} priorities`;
  const next = calendar.syncState === "preview" ? "Preview schedule · connect Google for live events" : calendar.syncState === "syncing" && !calendar.lastSyncedAt ? "Syncing calendar…" : calendar.syncState === "error" && !calendar.lastSyncedAt ? "Calendar unavailable" : brief.currentOrNextEvent ? `Next: ${brief.currentOrNextEvent.title} at ${formatBriefTime(brief.currentOrNextEvent.start)}` : "No more timed events today";
  return <Link href="/morning-brief" aria-label={`Morning Brief: ${metric}`} className="card card-interactive focus-ring group min-h-40 border-amber-200 p-4 dark:border-amber-900 xl:min-h-36"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Sunrise size={19}/></span><ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-amber-600" size={17}/></div><p className="eyebrow mt-4 text-amber-700 dark:text-amber-300">Morning brief</p><h2 className="mt-1 truncate font-bold tracking-[-0.03em]">{brief.headline === "Brief temporarily incomplete." ? brief.headline : "Your day is taking shape"}</h2><p className="mt-2 truncate text-xs font-semibold text-[var(--muted)]">{metric}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{next}</p></Link>;
}
