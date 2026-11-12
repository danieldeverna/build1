import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarDataProvider, useCalendarData } from "@/components/calendar/calendar-data-provider";
import { MorningBriefTile } from "@/components/morning-brief/morning-brief-tile";
import { MorningBriefWorkspace } from "@/components/morning-brief/morning-brief-workspace";
import type { CalendarEvent } from "@/domain/calendar";
import type { SourceSnapshot } from "@/domain/morning-brief";
import type { Task } from "@/domain/tasks";
import type { WeatherForecast } from "@/domain/weather";

const { routerRefresh } = vi.hoisted(() => ({ routerRefresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: routerRefresh }) }));
vi.mock("@/hooks/use-current-time", () => ({ useCurrentTime: () => new Date("2026-11-11T15:00:00.000Z") }));

const loadedAt = "2026-11-11T15:00:00.000Z";
const calendarEvent: CalendarEvent = { id: "class", title: "Macro", start: "2026-11-11T16:00:00.000Z", end: "2026-11-11T17:00:00.000Z", allDay: false, source: "google", location: "ICC 104", color: "violet" };
const task: Task = { id: "task", title: "Submit response", category: "academic", status: "open", dueDate: "2026-11-11", priority: "high", estimatedMinutes: 30, notes: null, source: "build1" };
const tasks: SourceSnapshot<Task[]> = { status: "ready", data: [task], loadedAt };
const weather: SourceSnapshot<WeatherForecast> = { status: "ready", loadedAt, data: { location: "Georgetown, D.C.", latitude: 0, longitude: 0, timezone: "America/New_York", current: { observedAt: "2026-11-11T10:00", temperature: 63, feelsLike: 62, humidity: 50, precipitation: 0, weatherCode: 2, cloudCover: 30, pressure: 1000, windSpeed: 5, windDirection: 90, windGusts: 8, uvIndex: 2 }, hourly: [{ time: "2026-11-11T10:00", temperature: 63, feelsLike: 62, precipitationChance: 20, weatherCode: 2, uvIndex: 2, windSpeed: 5, humidity: 50 }], daily: [{ date: "2026-11-11", weatherCode: 2, high: 68, low: 51, feelsLikeHigh: 68, feelsLikeLow: 50, precipitationChance: 20, uvIndex: 2, sunrise: "2026-11-11T06:45", sunset: "2026-11-11T16:55", windSpeed: 8 }] } };

function withCalendar(children: React.ReactNode) {
  return <CalendarDataProvider initialEvents={[calendarEvent]} googleCalendarConnected={false}>{children}</CalendarDataProvider>;
}

function CalendarProbe() {
  const calendar = useCalendarData();
  return <><button onClick={() => void calendar.refreshCalendar()}>Manual calendar refresh</button><span>{calendar.events[0]?.title ?? "No events"}</span></>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => { resolve = resolver; });
  return { promise, resolve };
}

describe("Morning Brief surfaces", () => {
  beforeEach(() => { window.localStorage.clear(); routerRefresh.mockClear(); });

  it("links the compact dashboard projection to the full brief", () => {
    render(withCalendar(<MorningBriefTile renderedAt={loadedAt} tasks={tasks} weather={weather}/>));
    expect(screen.getByRole("link", { name: /Morning Brief: 1 commitments · 1 priorities/ })).toHaveAttribute("href", "/morning-brief");
    expect(screen.getByText("Preview schedule · connect Google for live events")).toBeInTheDocument();
  });

  it("renders schedule, work, movement, weather, and accessible source states", () => {
    render(withCalendar(<MorningBriefWorkspace renderedAt={loadedAt} tasks={tasks} weather={weather}/>));
    expect(screen.getByRole("heading", { name: "Morning Brief" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Macro" })).toBeInTheDocument();
    expect(screen.getByText("Submit response")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preview workout schedule" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "63° · Partly cloudy" })).toBeInTheDocument();
    expect(screen.getByText("Calendar preview")).toBeInTheDocument();
    expect(screen.getByText("Fitness preview")).toBeInTheDocument();
  });

  it("blocks duplicate refreshes, waits for replacement server props, and retains failed task data as stale", async () => {
    const user = userEvent.setup();
    const view = render(withCalendar(<MorningBriefWorkspace renderedAt={loadedAt} tasks={tasks} weather={weather}/>));
    const refreshButton = screen.getByRole("button", { name: "Refresh brief" });
    await user.click(refreshButton);
    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Refreshing…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Refreshing…" }));
    expect(routerRefresh).toHaveBeenCalledTimes(1);

    const failedTasks: SourceSnapshot<Task[]> = { status: "error", data: null, attemptedAt: "2026-11-11T15:01:00.000Z", message: "Tasks unavailable" };
    view.rerender(withCalendar(<MorningBriefWorkspace renderedAt="2026-11-11T15:01:00.000Z" tasks={failedTasks} weather={weather}/>));
    expect(screen.getByRole("button", { name: "Refresh brief" })).toBeEnabled();
    expect(screen.getByText("Submit response")).toBeInTheDocument();
    expect(screen.getByText("Tasks may be stale")).toBeInTheDocument();
    expect(screen.getByText(/refreshed with one or more sources unavailable/i)).toBeInTheDocument();
  });

  it("keeps the newest calendar response when sync requests finish out of order", async () => {
    const originalFetch = global.fetch;
    const first = deferred<Response>();
    const second = deferred<Response>();
    global.fetch = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    try {
      render(<CalendarDataProvider initialEvents={[]} googleCalendarConnected><CalendarProbe/></CalendarDataProvider>);
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      fireEvent.click(screen.getByRole("button", { name: "Manual calendar refresh" }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
      const newest = { ...calendarEvent, id: "new", title: "Newest response" };
      await act(async () => second.resolve({ ok: true, json: async () => ({ events: [newest] }) } as Response));
      expect(await screen.findByText("Newest response")).toBeInTheDocument();
      const older = { ...calendarEvent, id: "old", title: "Older response" };
      await act(async () => first.resolve({ ok: true, json: async () => ({ events: [older] }) } as Response));
      expect(screen.getByText("Newest response")).toBeInTheDocument();
      expect(screen.queryByText("Older response")).not.toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
