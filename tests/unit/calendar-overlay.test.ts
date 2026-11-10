import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarEvent } from "@/domain/calendar";
import { addLocalEvent, CALENDAR_OVERLAY_CHANGED_EVENT, deleteEventFromOverlay, mergeCalendarEvents, readCalendarOverlay, saveCalendarOverlay, saveEventToOverlay } from "@/lib/calendar-overlay";

const imported: CalendarEvent = { id: "google-1", title: "Seminar", start: "2026-11-10T15:00:00.000Z", end: "2026-11-10T16:00:00.000Z", allDay: false, source: "google", color: "violet" };
const local: CalendarEvent = { id: "jarvis-1", title: "Focus time", start: "2026-11-10T17:00:00.000Z", end: "2026-11-10T18:00:00.000Z", allDay: false, source: "jarvis", color: "blue" };

describe("calendar overlay", () => {
  afterEach(() => window.localStorage.clear());

  it("overrides imported events without mutating the Google source", () => {
    const overlay = saveEventToOverlay({ ...imported, title: "Seminar · moved" }, { events: [], overrides: {}, deletedIds: [] });
    const visible = mergeCalendarEvents([imported], overlay);

    expect(visible).toHaveLength(1);
    expect(visible[0].title).toBe("Seminar · moved");
    expect(imported.title).toBe("Seminar");
  });

  it("keeps local creates and locally hides deleted imported events", () => {
    const created = addLocalEvent(local, { events: [], overrides: {}, deletedIds: [] });
    const deleted = deleteEventFromOverlay(imported, created);
    saveCalendarOverlay(deleted);

    expect(mergeCalendarEvents([imported], readCalendarOverlay())).toEqual([local]);
    expect(imported.id).toBe("google-1");
  });

  it("remembers a manually deleted automatic workout so sync cannot recreate it", () => {
    const workout = { ...local, id: "jarvis-upper", automationType: "workout" as const };
    const deleted = deleteEventFromOverlay(workout, addLocalEvent(workout, { events: [], overrides: {}, deletedIds: [] }));

    expect(deleted.events).toEqual([]);
    expect(deleted.deletedIds).toContain("jarvis-upper");
  });

  it("recovers safely from corrupt browser storage", () => {
    window.localStorage.setItem("jarvis-calendar-overlay-v1", "not-json");
    expect(readCalendarOverlay()).toEqual({ events: [], overrides: {}, deletedIds: [] });
  });

  it("notifies same-tab calendar consumers when the overlay changes", () => {
    const listener = vi.fn();
    window.addEventListener(CALENDAR_OVERLAY_CHANGED_EVENT, listener);
    saveCalendarOverlay({ events: [], overrides: {}, deletedIds: [] });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(CALENDAR_OVERLAY_CHANGED_EVENT, listener);
  });
});
