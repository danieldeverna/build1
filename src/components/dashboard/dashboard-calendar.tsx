"use client";

import { format } from "date-fns";
import { useCalendarData } from "@/components/calendar/calendar-data-provider";
import { DayAgenda } from "@/components/dashboard/day-agenda";
import { eventOccursOn } from "@/domain/calendar";
import { cn } from "@/lib/cn";

export function DashboardAgendaCard() {
  const { events, syncState } = useCalendarData();
  const today = new Date();
  const todayEvents = events.filter((event) => eventOccursOn(event, today));

  return (
    <section className="card flex overflow-hidden xl:h-[21.5rem] xl:flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-bold">Daily agenda</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{format(today, "EEEE, MMMM d")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
          <span className={cn("size-2 rounded-full", syncState === "error" ? "bg-rose-500" : syncState === "syncing" ? "bg-blue-500" : "bg-emerald-500")} />
          {todayEvents.length} {todayEvents.length === 1 ? "event" : "events"} today
        </div>
      </div>
      <div className="min-h-0 flex-1 px-3 pb-3 pt-3 sm:px-4">
        <DayAgenda events={events} compact />
      </div>
    </section>
  );
}

export function DashboardCalendarStatus() {
  const { googleCalendarConnected, syncMessage, syncState } = useCalendarData();
  return (
    <div className={cn("mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs", syncState === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "bg-[var(--surface-subtle)] text-[var(--muted)]")}>
      <span className="flex items-center gap-2"><span className={cn("size-1.5 rounded-full", syncState === "error" ? "bg-rose-500" : googleCalendarConnected ? "bg-emerald-500" : "bg-amber-400")} />{syncMessage} Canvas remains setup-pending.</span>
    </div>
  );
}
