import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";

describe("CalendarWorkspace", () => {
  it("opens, cancels, and creates a local draft", async () => {
    const user = userEvent.setup();
    render(<CalendarWorkspace initialEvents={[]} />);

    await user.click(screen.getByRole("button", { name: "New draft" }));
    expect(screen.getByRole("dialog", { name: "Create event draft" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New draft" }));
    const dialog = screen.getByRole("dialog", { name: "Create event draft" });
    await user.type(within(dialog).getByLabelText("Title"), "Portfolio review");
    await user.click(within(dialog).getByRole("button", { name: "Save draft" }));

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
});
