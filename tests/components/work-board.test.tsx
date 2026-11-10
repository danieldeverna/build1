import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkBoard } from "@/components/work/work-board";

const taskActions = vi.hoisted(() => ({
  archive: vi.fn(),
  create: vi.fn(),
  setCompletion: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/app/(app)/work/actions", () => ({
  archiveTaskAction: taskActions.archive,
  createTaskAction: taskActions.create,
  setTaskCompletionAction: taskActions.setCompletion,
  updateTaskAction: taskActions.update,
}));

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
  beforeEach(() => vi.clearAllMocks());

  it("creates a task with only title and category", async () => {
    const user = userEvent.setup();
    taskActions.create.mockResolvedValue({ ok: true, task: { ...existingTask, id: "new-task", title: "Prepare interview notes" } });
    render(<WorkBoard initialTasks={[]} />);
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Title"), "Prepare interview notes");
    await user.selectOptions(screen.getByLabelText("Category"), "recruiting");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add task" }));
    expect(await screen.findByText("Prepare interview notes")).toBeInTheDocument();
    expect(screen.getAllByText("Recruiting")).toHaveLength(2);
  });

  it("edits, completes, reopens, and deletes a task", async () => {
    const user = userEvent.setup();
    const updatedTask = { ...existingTask, title: "Send outreach note" };
    taskActions.update.mockResolvedValue({ ok: true, task: updatedTask });
    taskActions.setCompletion
      .mockResolvedValueOnce({ ok: true, task: { ...updatedTask, status: "completed" } })
      .mockResolvedValueOnce({ ok: true, task: updatedTask });
    taskActions.archive.mockResolvedValue({ ok: true });
    render(<WorkBoard initialTasks={[existingTask]} />);

    await user.click(screen.getByRole("button", { name: "Edit Draft outreach note" }));
    const title = within(screen.getByRole("dialog")).getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Send outreach note");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Send outreach note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Complete Send outreach note" }));
    expect(await screen.findByText("Nothing waiting here")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Show completed"));
    await user.click(screen.getByRole("button", { name: "Reopen Send outreach note" }));
    expect(await screen.findByText("Send outreach note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive Send outreach note" }));
    expect(await screen.findByText("Nothing waiting here")).toBeInTheDocument();
    expect(taskActions.archive).toHaveBeenCalledWith(existingTask.id);
  });

  it("keeps the task dialog open and explains a failed save", async () => {
    const user = userEvent.setup();
    taskActions.create.mockResolvedValue({ ok: false, error: "Database unavailable" });
    render(<WorkBoard initialTasks={[]} />);

    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Title"), "Keep this input");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Keep this input");
  });
});
