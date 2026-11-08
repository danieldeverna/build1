import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WorkBoard } from "@/components/work/work-board";

const existingTask = {
  id: "task-1",
  title: "Draft outreach note",
  category: "recruiting" as const,
  status: "open" as const,
  dueDate: null,
  priority: null,
  estimatedMinutes: null,
  notes: null,
  source: "build1" as const,
};

describe("WorkBoard", () => {
  it("creates a task with only title and category", async () => {
    const user = userEvent.setup();
    render(<WorkBoard initialTasks={[]} />);
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Title"), "Prepare interview notes");
    await user.selectOptions(screen.getByLabelText("Category"), "recruiting");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add task" }));
    expect(screen.getByText("Prepare interview notes")).toBeInTheDocument();
    expect(screen.getAllByText("Recruiting")).toHaveLength(2);
  });

  it("edits, completes, reopens, and deletes a task", async () => {
    const user = userEvent.setup();
    render(<WorkBoard initialTasks={[existingTask]} />);

    await user.click(screen.getByRole("button", { name: "Edit Draft outreach note" }));
    const title = within(screen.getByRole("dialog")).getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Send outreach note");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Send outreach note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Complete Send outreach note" }));
    expect(screen.queryByText("Send outreach note")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Show completed"));
    await user.click(screen.getByRole("button", { name: "Reopen Send outreach note" }));
    expect(screen.getByText("Send outreach note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Send outreach note" }));
    expect(screen.queryByText("Send outreach note")).not.toBeInTheDocument();
  });
});
