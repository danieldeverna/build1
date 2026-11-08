import type { CalendarEvent } from "@/domain/calendar";

type GoogleEvent = {
  id?: string | null;
  summary?: string | null;
  location?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
};

export function normalizeGoogleEvent(event: GoogleEvent): CalendarEvent | null {
  const startValue = event.start?.dateTime ?? event.start?.date;
  const endValue = event.end?.dateTime ?? event.end?.date;
  if (!event.id || !startValue || !endValue) return null;

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  return {
    id: event.id,
    title: event.summary?.trim() || "Untitled event",
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
    source: "google",
    location: event.location ?? undefined,
    color: "violet",
  };
}
