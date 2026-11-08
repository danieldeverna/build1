import { describe, expect, it } from "vitest";
import { filterTasks, incompleteTaskCounts, taskInputSchema, type Task } from "@/domain/tasks";

const tasks: Task[] = [
  { id: "1", title: "Essay", category: "academic", status: "open", dueDate: null, priority: null, estimatedMinutes: null, notes: null, source: "build1" },
  { id: "2", title: "Follow up", category: "recruiting", status: "completed", dueDate: null, priority: null, estimatedMinutes: null, notes: null, source: "build1" },
  { id: "3", title: "Prototype", category: "projects", status: "open", dueDate: null, priority: null, estimatedMinutes: null, notes: null, source: "build1" },
];

describe("task domain", () => {
  it("requires only a title and valid category", () => {
    expect(taskInputSchema.safeParse({ title: "Read chapter", category: "academic" }).success).toBe(true);
    expect(taskInputSchema.safeParse({ title: "", category: "academic" }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: "Call", category: "personal" }).success).toBe(false);
  });

  it("filters without hiding completed items from category views", () => {
    expect(filterTasks(tasks, "recruiting").map((task) => task.id)).toEqual(["2"]);
    expect(filterTasks(tasks, "all")).toHaveLength(3);
  });

  it("counts only open work", () => {
    expect(incompleteTaskCounts(tasks)).toEqual({ all: 2, academic: 1, recruiting: 0, projects: 1 });
  });

  it("rejects archived work from views and validates optional field limits", () => {
    const archived = { ...tasks[0], id: "4", status: "archived" as const };
    expect(filterTasks([...tasks, archived], "all").map((task) => task.id)).not.toContain("4");
    expect(taskInputSchema.safeParse({ title: "Plan", category: "projects", estimatedMinutes: 0 }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: "Plan", category: "projects", estimatedMinutes: 1_441 }).success).toBe(false);
    expect(taskInputSchema.safeParse({ title: "x".repeat(161), category: "projects" }).success).toBe(false);
  });
});
