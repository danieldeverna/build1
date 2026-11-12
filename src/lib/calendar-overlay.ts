import type { CalendarEvent } from "@/domain/calendar";

const STORAGE_KEY = "jarvis-calendar-overlay-v1";
export const CALENDAR_OVERLAY_CHANGED_EVENT = "jarvis:calendar-overlay-changed";

export type CalendarOverlay = {
  events: CalendarEvent[];
  overrides: Record<string, CalendarEvent>;
  deletedIds: string[];
};

const emptyOverlay = (): CalendarOverlay => ({ events: [], overrides: {}, deletedIds: [] });

export function readCalendarOverlay(): CalendarOverlay {
  if (typeof window === "undefined") return emptyOverlay();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<CalendarOverlay> | null;
    return {
      events: Array.isArray(parsed?.events) ? parsed.events : [],
      overrides: parsed?.overrides && typeof parsed.overrides === "object" ? parsed.overrides as Record<string, CalendarEvent> : {},
      deletedIds: Array.isArray(parsed?.deletedIds) ? parsed.deletedIds : [],
    };
  } catch {
    return emptyOverlay();
  }
}

export function saveCalendarOverlay(overlay: CalendarOverlay) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
    window.dispatchEvent(new Event(CALENDAR_OVERLAY_CHANGED_EVENT));
  }
}

export function mergeCalendarEvents(providerEvents: CalendarEvent[], overlay: CalendarOverlay) {
  const deleted = new Set(overlay.deletedIds);
  const imported = providerEvents
    .filter((event) => !deleted.has(event.id))
    .map((event) => overlay.overrides[event.id] ?? event);
  return [...imported, ...overlay.events.filter((event) => !deleted.has(event.id))]
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
}

export function saveEventToOverlay(event: CalendarEvent, overlay: CalendarOverlay): CalendarOverlay {
  const localIndex = overlay.events.findIndex((candidate) => candidate.id === event.id);
  if (localIndex >= 0) {
    const events = [...overlay.events];
    events[localIndex] = event;
    return { ...overlay, events };
  }
  return {
    ...overlay,
    overrides: { ...overlay.overrides, [event.id]: event },
    deletedIds: overlay.deletedIds.filter((id) => id !== event.id),
  };
}

export function addLocalEvent(event: CalendarEvent, overlay: CalendarOverlay): CalendarOverlay {
  return { ...overlay, events: [...overlay.events.filter((candidate) => candidate.id !== event.id), event] };
}

export function deleteEventFromOverlay(event: CalendarEvent, overlay: CalendarOverlay): CalendarOverlay {
  const isLocal = overlay.events.some((candidate) => candidate.id === event.id);
  if (isLocal) return { ...overlay, events: overlay.events.filter((candidate) => candidate.id !== event.id), deletedIds: event.automationType === "workout" ? [...new Set([...overlay.deletedIds, event.id])] : overlay.deletedIds };
  const overrides = { ...overlay.overrides };
  delete overrides[event.id];
  return { ...overlay, overrides, deletedIds: [...new Set([...overlay.deletedIds, event.id])] };
}
