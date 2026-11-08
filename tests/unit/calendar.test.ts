import { describe, expect, it } from "vitest";
import { eventOccursOn, getCurrentTimeOffset, positionDayEvent, type CalendarEvent } from "@/domain/calendar";

const event: CalendarEvent = {
  id: "event",
  title: "Seminar",
  start: "2026-11-07T09:30:00-05:00",
  end: "2026-11-07T10:45:00-05:00",
  allDay: false,
  source: "google",
  color: "violet",
};

describe("calendar positioning", () => {
  it("maps event time to timeline pixels", () => {
    const result = positionDayEvent(event, 7, 60);
    expect(result.top).toBe(150);
    expect(result.height).toBe(75);
  });

  it("maps current time to the same coordinate system", () => {
    const now = new Date(2026, 10, 7, 12, 30);
    expect(getCurrentTimeOffset(now, 7, 60)).toBe(330);
  });

  it("clamps early and short events to visible minimums", () => {
    const result = positionDayEvent({
      ...event,
      start: "2026-11-07T06:30:00-05:00",
      end: "2026-11-07T06:40:00-05:00",
    }, 7, 60);

    expect(result.top).toBe(0);
    expect(result.height).toBe(34);
  });

  it("matches events only to their local calendar day", () => {
    expect(eventOccursOn(event, new Date(2026, 10, 7))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 10, 8))).toBe(false);
  });
});
