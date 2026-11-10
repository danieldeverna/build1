import { z } from "zod";

export const taskCategories = ["academic", "recruiting", "projects"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskCategory = (typeof taskCategories)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = "open" | "completed" | "archived";

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;
  priority: TaskPriority | null;
  estimatedMinutes: number | null;
  notes: string | null;
  source: "build1" | "imported";
};

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Add a task title").max(160),
  category: z.enum(taskCategories),
  dueDate: z.iso.date().nullable().optional(),
  priority: z.enum(taskPriorities).nullable().optional(),
  estimatedMinutes: z.number().int().positive().max(1_440).nullable().optional(),
  notes: z.string().trim().max(2_000).nullable().optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export function filterTasks(tasks: Task[], category: TaskCategory | "all") {
  return tasks.filter(
    (task) => task.status !== "archived" && (category === "all" || task.category === category),
  );
}

export function incompleteTaskCounts(tasks: Task[]) {
  return tasks.reduce(
    (counts, task) => {
      if (task.status === "open") {
        counts.all += 1;
        counts[task.category] += 1;
      }
      return counts;
    },
    { all: 0, academic: 0, recruiting: 0, projects: 0 },
  );
}
