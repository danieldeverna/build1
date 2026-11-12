import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarDataProvider } from "@/components/calendar/calendar-data-provider";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import type { CalendarEvent } from "@/domain/calendar";

function renderCalendar(initialEvents: CalendarEvent[] = [], googleCalendarConnected = false) {
  return render(<CalendarDataProvider initialEvents={initialEvents} googleCalendarConnected={googleCalendarConnected}><CalendarWorkspace /></CalendarDataProvider>);
}

describe("CalendarWorkspace", () => {
  afterEach(() => { vi.unstubAllGlobals(); window.localStorage.clear(); });

  it("opens, cancels, and creates a local draft", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: "New event" }));
    expect(screen.getByRole("dialog", { name: "Create event" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "New event" }));
    const dialog = screen.getByRole("dialog", { name: "Create event" });
    await user.type(within(dialog).getByLabelText("Title"), "Portfolio review");
    await user.click(within(dialog).getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Portfolio review")).toBeInTheDocument();
  });

  it("navigates periods and opens a selected day", async () => {
    const user = userEvent.setup();
    renderCalendar();
    const initialHeading = screen.getByRole("heading", { level: 2 }).textContent;

    await user.click(screen.getByRole("button", { name: "Next period" }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(initialHeading);

    await user.click(screen.getByRole("button", { name: /month/i }));
    const dayButtons = screen.getAllByRole("button").filter((button) => /^\d{1,2}$/.test(button.textContent ?? ""));
    await user.click(dayButtons[10]);
    expect(screen.getByRole("button", { name: /^day$/i })).toHaveClass("bg-[var(--surface)]");
  });

  it("replaces preview data with live Google Calendar events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      events: [{ id: "google-live", title: "Live class", start: new Date().toISOString(), end: new Date(Date.now() + 3_600_000).toISOString(), allDay: false, source: "google", color: "violet" }],
    }), { status: 200 })));

    renderCalendar([], true);

    expect(await screen.findByText(/1 events synced/i)).toBeInTheDocument();
    expect(screen.getByText("Live class")).toBeInTheDocument();
  });

  it("edits and deletes a Google event only from Jarvis", async () => {
    const user = userEvent.setup();
    const event = { id: "google-live", title: "Live class", start: new Date().toISOString(), end: new Date(Date.now() + 3_600_000).toISOString(), allDay: false, source: "google" as const, color: "violet" as const };
    renderCalendar([event]);

    await user.click(screen.getByRole("button", { name: /Live class/ }));
    await user.click(screen.getByRole("button", { name: "Edit in Jarvis" }));
    const dialog = screen.getByRole("dialog", { name: "Edit event" });
    const title = within(dialog).getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Moved class");
    await user.click(within(dialog).getByRole("button", { name: "Save in Jarvis" }));
    expect(screen.getByRole("heading", { name: "Moved class" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete from Jarvis" }));
    expect(screen.queryByText("Moved class")).not.toBeInTheDocument();
  });

  it("moves a dragged event without opening its edit dialog", () => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const event: CalendarEvent = { id: "drag-me", title: "Drag me", start: today.toISOString(), end: new Date(today.getTime() + 3_600_000).toISOString(), allDay: false, source: "jarvis", color: "blue" };
    renderCalendar([event]);

    const target = new Date(today);
    target.setDate(today.getDate() + (today.getDay() === 0 ? -1 : 1));
    const targetLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(target);
    const dataTransfer = { setData: vi.fn(), getData: vi.fn().mockReturnValue(event.id) };

    fireEvent.dragStart(screen.getByRole("button", { name: /Drag me/ }), { dataTransfer });
    fireEvent.drop(screen.getByLabelText(`${targetLabel} timeline`), { dataTransfer });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem("jarvis-calendar-overlay-v1") ?? "{}") as { overrides?: Record<string, CalendarEvent> };
    expect(new Date(stored.overrides?.[event.id]?.start ?? "").getDate()).toBe(target.getDate());
  });

  it("moves a multi-day all-day event without changing its duration or opening details", () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    const event: CalendarEvent = { id: "all-day-drag", title: "Conference", start: start.toISOString(), end: end.toISOString(), allDay: true, source: "google", color: "violet" };
    renderCalendar([event]);

    const target = new Date(start);
    target.setDate(target.getDate() + 1);
    const targetLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(target);
    const dataTransfer = { setData: vi.fn(), getData: vi.fn().mockReturnValue(event.id) };
    fireEvent.dragStart(screen.getAllByRole("button", { name: "Conference" })[0], { dataTransfer });
    fireEvent.drop(screen.getByLabelText(`${targetLabel} all-day events`), { dataTransfer });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem("jarvis-calendar-overlay-v1") ?? "{}") as { overrides?: Record<string, CalendarEvent> };
    const moved = stored.overrides?.[event.id];
    expect(moved?.start.slice(0, 10)).toBe(target.toISOString().slice(0, 10));
    expect((new Date(moved?.end ?? "").getTime() - new Date(moved?.start ?? "").getTime()) / 86_400_000).toBe(2);
  });

  it("shows a current-time line in the current week", async () => {
    renderCalendar();
    expect(await screen.findByLabelText("Current time")).toBeInTheDocument();
  });
});
