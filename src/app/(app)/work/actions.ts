"use server";

import { revalidatePath } from "next/cache";
import { taskInputSchema, type Task, type TaskInput } from "@/domain/tasks";
import { archiveTaskForCurrentViewer, createTaskForCurrentViewer, setTaskCompletionForCurrentViewer, TaskAccessError, TaskNotFoundError, updateTaskForCurrentViewer } from "@/data/tasks";

export type TaskActionResult = { ok: true; task?: Task } | { ok: false; error: string };

function taskActionError(error: unknown): TaskActionResult {
  if (error instanceof TaskAccessError || error instanceof TaskNotFoundError) return { ok: false, error: error.message };
  return { ok: false, error: "Jarvis could not save that change. Please try again." };
}

function refreshTaskViews() {
  revalidatePath("/work");
  revalidatePath("/dashboard");
}

export async function createTaskAction(input: TaskInput): Promise<TaskActionResult> {
  try {
    const task = await createTaskForCurrentViewer(taskInputSchema.parse(input));
    refreshTaskViews();
    return { ok: true, task };
  } catch (error) {
    return taskActionError(error);
  }
}

export async function updateTaskAction(taskId: string, input: TaskInput): Promise<TaskActionResult> {
  try {
    const task = await updateTaskForCurrentViewer(taskId, taskInputSchema.parse(input));
    refreshTaskViews();
    return { ok: true, task };
  } catch (error) {
    return taskActionError(error);
  }
}

export async function setTaskCompletionAction(taskId: string, completed: boolean): Promise<TaskActionResult> {
  try {
    const task = await setTaskCompletionForCurrentViewer(taskId, completed);
    refreshTaskViews();
    return { ok: true, task };
  } catch (error) {
    return taskActionError(error);
  }
}

export async function archiveTaskAction(taskId: string): Promise<TaskActionResult> {
  try {
    await archiveTaskForCurrentViewer(taskId);
    refreshTaskViews();
    return { ok: true };
  } catch (error) {
    return taskActionError(error);
  }
}
