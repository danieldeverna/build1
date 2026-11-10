import { describe, expect, it } from "vitest";
import { normalizeGoogleEvent } from "@/integrations/google-calendar/normalize";

describe("Google Calendar normalization", () => {
  it("normalizes timed events as read-only calendar data", () => {
    const result = normalizeGoogleEvent({ id: "g-1", summary: "Class", description: "Bring notes", htmlLink: "https://calendar.google.com/event/1", recurringEventId: "series-1", start: { dateTime: "2026-11-07T10:00:00-05:00" }, end: { dateTime: "2026-11-07T11:00:00-05:00" } });
    expect(result).toMatchObject({ id: "g-1", title: "Class", allDay: false, source: "google", notes: "Bring notes", url: "https://calendar.google.com/event/1", recurringEventId: "series-1", canEdit: true, canDelete: true });
  });

  it("recognizes all-day events and rejects incomplete records", () => {
    expect(normalizeGoogleEvent({ id: "g-2", start: { date: "2026-11-07" }, end: { date: "2026-11-08" } })?.allDay).toBe(true);
    expect(normalizeGoogleEvent({ id: "g-3", start: { date: "2026-11-07" } })).toBeNull();
  });

  it("applies safe fallbacks and rejects malformed provider dates", () => {
    const fallback = normalizeGoogleEvent({
      id: "g-4",
      summary: "   ",
      start: { dateTime: "2026-11-07T10:00:00-05:00" },
      end: { dateTime: "2026-11-07T11:00:00-05:00" },
    });

    expect(fallback).toMatchObject({ title: "Untitled event", location: undefined });
    expect(normalizeGoogleEvent({ id: "g-5", start: { dateTime: "bad" }, end: { dateTime: "also-bad" } })).toBeNull();
    expect(normalizeGoogleEvent({ id: "g-6", start: { dateTime: "2026-11-07T11:00:00-05:00" }, end: { dateTime: "2026-11-07T10:00:00-05:00" } })).toBeNull();
  });
});
