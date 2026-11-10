import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarDataProvider } from "@/components/calendar/calendar-data-provider";
import { DashboardAgendaCard, DashboardCalendarStatus } from "@/components/dashboard/dashboard-calendar";
import type { CalendarEvent } from "@/domain/calendar";

describe("dashboard calendar", () => {
  it("renders the same provider events used by the calendar workspace", () => {
    const start = new Date();
    start.setHours(14, 0, 0, 0);
    const event: CalendarEvent = { id: "shared-event", title: "Shared live event", start: start.toISOString(), end: new Date(start.getTime() + 3_600_000).toISOString(), allDay: false, source: "google", color: "violet" };
    render(<CalendarDataProvider initialEvents={[event]} googleCalendarConnected={false}><DashboardAgendaCard/><DashboardCalendarStatus/></CalendarDataProvider>);
    expect(screen.getByRole("button", { name: /Shared live event/ })).toBeInTheDocument();
    expect(screen.getByText("1 event today")).toBeInTheDocument();
    expect(screen.getByText(/Preview mode/)).toBeInTheDocument();
  });
});
