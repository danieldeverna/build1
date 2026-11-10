"use client";

import { addDays } from "date-fns";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/domain/calendar";
import type { PlannedWorkout } from "@/domain/fitness";
import { CALENDAR_OVERLAY_CHANGED_EVENT, mergeCalendarEvents, readCalendarOverlay, saveCalendarOverlay, type CalendarOverlay } from "@/lib/calendar-overlay";
import { reconcileFitnessCalendar } from "@/lib/fitness-calendar-sync";

export type CalendarSyncState = "preview" | "syncing" | "live" | "error";

type CalendarData = {
  events: CalendarEvent[];
  overlay: CalendarOverlay;
  saveOverlay: (overlay: CalendarOverlay) => void;
  syncState: CalendarSyncState;
  syncMessage: string;
  googleCalendarConnected: boolean;
  fitnessPlan: PlannedWorkout[] | null;
};

const CalendarDataContext = createContext<CalendarData | null>(null);

export function CalendarDataProvider({ children, initialEvents, googleCalendarConnected }: { children: React.ReactNode; initialEvents: CalendarEvent[]; googleCalendarConnected: boolean }) {
  const [providerEvents, setProviderEvents] = useState(initialEvents);
  const [overlay, setOverlay] = useState<CalendarOverlay>(() => readCalendarOverlay());
  const [fitnessPlan, setFitnessPlan] = useState<PlannedWorkout[] | null>(null);
  const [syncState, setSyncState] = useState<CalendarSyncState>(googleCalendarConnected ? "syncing" : "preview");
  const [syncMessage, setSyncMessage] = useState(googleCalendarConnected ? "Syncing your Google Calendar…" : "Preview mode · Google Calendar is not connected. Changes stay on this device.");
  const events = useMemo(() => mergeCalendarEvents(providerEvents, overlay), [overlay, providerEvents]);

  const saveOverlay = useCallback((nextOverlay: CalendarOverlay) => {
    setOverlay(nextOverlay);
    saveCalendarOverlay(nextOverlay);
  }, []);

  useEffect(() => {
    const refreshOverlay = () => setOverlay(readCalendarOverlay());
    window.addEventListener(CALENDAR_OVERLAY_CHANGED_EVENT, refreshOverlay);
    return () => window.removeEventListener(CALENDAR_OVERLAY_CHANGED_EVENT, refreshOverlay);
  }, []);

  useEffect(() => {
    if (!googleCalendarConnected) return;

    let active = true;
    const sync = async () => {
      setSyncState((current) => current === "live" ? current : "syncing");
      try {
        const timeMin = addDays(new Date(), -90).toISOString();
        const timeMax = addDays(new Date(), 365).toISOString();
        const response = await fetch(`/api/integrations/google-calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
        const result = await response.json() as { events?: CalendarEvent[]; error?: string };
        if (!response.ok || !result.events) throw new Error(result.error || "Calendar sync failed");
        if (!active) return;
        const reconciliation = reconcileFitnessCalendar(result.events);
        setProviderEvents(result.events);
        setOverlay(reconciliation.overlay);
        setFitnessPlan(reconciliation.plan);
        setSyncState("live");
        setSyncMessage(`Live Google Calendar · ${result.events.length} events synced. Jarvis changes never write back to Google.`);
      } catch (error) {
        if (!active) return;
        setSyncState("error");
        setSyncMessage(error instanceof Error ? error.message : "Calendar sync failed. Reconnect from Settings.");
      }
    };

    void sync();
    const interval = window.setInterval(() => void sync(), 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [googleCalendarConnected, initialEvents]);

  const value = useMemo<CalendarData>(() => ({ events, overlay, saveOverlay, syncState, syncMessage, googleCalendarConnected, fitnessPlan }), [events, fitnessPlan, googleCalendarConnected, overlay, saveOverlay, syncMessage, syncState]);
  return <CalendarDataContext.Provider value={value}>{children}</CalendarDataContext.Provider>;
}

export function useCalendarData() {
  const value = useContext(CalendarDataContext);
  if (!value) throw new Error("useCalendarData must be used inside CalendarDataProvider.");
  return value;
}
