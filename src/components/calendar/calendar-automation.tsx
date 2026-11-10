"use client";

import { addDays, startOfWeek } from "date-fns";
import { useEffect } from "react";
import type { CalendarEvent } from "@/domain/calendar";
import { reconcileFitnessCalendar } from "@/lib/fitness-calendar-sync";

/** Runs while the private app shell is open; it writes only to Jarvis's calendar overlay. */
export function CalendarAutomation({ googleCalendarConnected }: { googleCalendarConnected: boolean }) {
  useEffect(() => {
    if (!googleCalendarConnected) return;
    let active = true;
    const sync = async () => {
      try {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const response = await fetch(`/api/integrations/google-calendar/events?timeMin=${encodeURIComponent(weekStart.toISOString())}&timeMax=${encodeURIComponent(addDays(weekStart, 7).toISOString())}`);
        const result = await response.json() as { events?: CalendarEvent[] };
        if (active && response.ok && result.events) reconcileFitnessCalendar(result.events);
      } catch {
        // Keep the last Jarvis-only workout plan when the provider is unavailable.
      }
    };
    void sync();
    const interval = window.setInterval(() => void sync(), 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [googleCalendarConnected]);
  return null;
}
