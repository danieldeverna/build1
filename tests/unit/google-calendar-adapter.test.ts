import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleCalendarApiAdapter } from "@/integrations/google-calendar/adapter";

describe("Google Calendar API adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists and normalizes paginated events", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: "one", summary: "Class", start: { dateTime: "2026-11-09T10:00:00-05:00" }, end: { dateTime: "2026-11-09T11:00:00-05:00" } }],
        nextPageToken: "next",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: "two", summary: "Office hours", start: { dateTime: "2026-11-09T12:00:00-05:00" }, end: { dateTime: "2026-11-09T13:00:00-05:00" } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const events = await new GoogleCalendarApiAdapter("access-token").listEvents({ start: new Date("2026-11-09T00:00:00Z"), end: new Date("2026-11-10T00:00:00Z") });
    expect(events.map((event) => event.id)).toEqual(["one", "two"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("pageToken=next");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ authorization: "Bearer access-token" });
  });

  it("uses only GET requests when reading Google events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new GoogleCalendarApiAdapter("access-token").listEvents({ start: new Date("2026-11-09T00:00:00Z"), end: new Date("2026-11-10T00:00:00Z") });

    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });
});
