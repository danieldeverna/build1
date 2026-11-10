import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";

describe("CalendarWorkspace", () => {
  afterEach(() => { vi.unstubAllGlobals(); window.localStorage.clear(); });

  it("opens, cancels, and creates a local draft", async () => {
    const user = userEvent.setup();
    render(<CalendarWorkspace initialEvents={[]} />);

    await user.click(screen.getByRole("button", { name: "New event" }));
    expect(screen.getByRole("dialog", { name: "Create event" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New event" }));
    const dialog = screen.getByRole("dialog", { name: "Create event" });
    await user.type(within(dialog).getByLabelText("Title"), "Portfolio review");
    await user.click(within(dialog).getByRole("button", { name: "Save event" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Portfolio review")).toBeInTheDocument();
  });

  it("navigates periods and opens a selected day", async () => {
    const user = userEvent.setup();
    render(<CalendarWorkspace initialEvents={[]} />);
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

    render(<CalendarWorkspace initialEvents={[]} googleCalendarConnected />);

    expect(await screen.findByText(/1 events synced/i)).toBeInTheDocument();
    expect(screen.getByText("Live class")).toBeInTheDocument();
  });

  it("edits and deletes a Google event only from Jarvis", async () => {
    const user = userEvent.setup();
    const event = { id: "google-live", title: "Live class", start: new Date().toISOString(), end: new Date(Date.now() + 3_600_000).toISOString(), allDay: false, source: "google" as const, color: "violet" as const };
    render(<CalendarWorkspace initialEvents={[event]} />);

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
});
