import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";
import { activityLogs, tasks, users } from "@/db/schema";
import { getDatabase, type Database } from "@/db/client";
import { taskInputSchema, type Task, type TaskInput } from "@/domain/tasks";
import { getCurrentViewer } from "@/lib/auth";

type TaskRow = typeof tasks.$inferSelect;

export class TaskAccessError extends Error {}
export class TaskNotFoundError extends Error {}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    dueDate: row.dueDate,
    priority: row.priority,
    estimatedMinutes: row.estimatedMinutes,
    notes: row.notes,
    source: row.source,
  };
}

async function currentViewerIdentity() {
  const viewer = await getCurrentViewer();
  if (!viewer?.email) throw new TaskAccessError("Sign in again to access your work.");
  return { email: viewer.email.toLowerCase(), name: viewer.name, imageUrl: viewer.image };
}

async function findDatabaseUser(database: Database) {
  const viewer = await currentViewerIdentity();
  const [user] = await database.select({ id: users.id }).from(users).where(eq(users.email, viewer.email)).limit(1);
  return user ?? null;
}

async function requireDatabaseUser(database: Database) {
  const viewer = await currentViewerIdentity();

  const [user] = await database
    .insert(users)
    .values(viewer)
    .onConflictDoUpdate({
      target: users.email,
      set: { name: viewer.name, imageUrl: viewer.imageUrl, updatedAt: new Date() },
    })
    .returning({ id: users.id });

  if (!user) throw new TaskAccessError("Jarvis could not resolve the signed-in account.");
  return user;
}

function normalizedTaskValues(input: TaskInput) {
  const parsed = taskInputSchema.parse(input);
  return {
    title: parsed.title,
    category: parsed.category,
    dueDate: parsed.dueDate ?? null,
    priority: parsed.priority ?? null,
    estimatedMinutes: parsed.estimatedMinutes ?? null,
    notes: parsed.notes ?? null,
  };
}

export async function listTasksForCurrentViewer(database?: Database): Promise<Task[]> {
  database ??= await getDatabase();
  const user = await findDatabaseUser(database);
  if (!user) return [];
  const rows = await database
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), ne(tasks.status, "archived")))
    .orderBy(desc(tasks.createdAt));
  return rows.map(toTask);
}

export async function createTaskForCurrentViewer(input: TaskInput, database?: Database): Promise<Task> {
  database ??= await getDatabase();
  const user = await requireDatabaseUser(database);
  const values = normalizedTaskValues(input);

  return database.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(tasks)
      .values({ userId: user.id, ...values, source: "build1" })
      .returning();
    if (!created) throw new Error("Task creation did not return a record.");

    await transaction.insert(activityLogs).values({
      userId: user.id,
      action: "task.created",
      targetType: "task",
      targetId: created.id,
      summary: `Created task: ${created.title}`,
      metadata: { category: created.category, dueDate: created.dueDate },
    });
    return toTask(created);
  });
}

export async function updateTaskForCurrentViewer(taskId: string, input: TaskInput, database?: Database): Promise<Task> {
  database ??= await getDatabase();
  const user = await requireDatabaseUser(database);
  const values = normalizedTaskValues(input);

  return database.transaction(async (transaction) => {
    const [existing] = await transaction.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), ne(tasks.status, "archived"))).limit(1);
    if (!existing) throw new TaskNotFoundError("That task no longer exists.");

    const [updated] = await transaction
      .update(tasks)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
      .returning();
    if (!updated) throw new TaskNotFoundError("That task no longer exists.");

    const changes = Object.fromEntries(
      Object.entries(values)
        .filter(([key, value]) => existing[key as keyof typeof values] !== value)
        .map(([key, value]) => [key, { from: existing[key as keyof typeof values], to: value }]),
    );
    await transaction.insert(activityLogs).values({
      userId: user.id,
      action: "task.updated",
      targetType: "task",
      targetId: updated.id,
      summary: `Updated task: ${updated.title}`,
      metadata: { changes },
    });
    return toTask(updated);
  });
}

export async function setTaskCompletionForCurrentViewer(taskId: string, completed: boolean, database?: Database): Promise<Task> {
  database ??= await getDatabase();
  const user = await requireDatabaseUser(database);

  return database.transaction(async (transaction) => {
    const [existing] = await transaction.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), ne(tasks.status, "archived"))).limit(1);
    if (!existing) throw new TaskNotFoundError("That task no longer exists.");

    const [updated] = await transaction
      .update(tasks)
      .set({ status: completed ? "completed" : "open", completedAt: completed ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
      .returning();
    if (!updated) throw new TaskNotFoundError("That task no longer exists.");

    await transaction.insert(activityLogs).values({
      userId: user.id,
      action: completed ? "task.completed" : "task.reopened",
      targetType: "task",
      targetId: updated.id,
      summary: `${completed ? "Completed" : "Reopened"} task: ${updated.title}`,
      metadata: { previousStatus: existing.status, nextStatus: updated.status, completedAt: updated.completedAt?.toISOString() ?? null },
    });
    return toTask(updated);
  });
}

export async function archiveTaskForCurrentViewer(taskId: string, database?: Database): Promise<void> {
  database ??= await getDatabase();
  const user = await requireDatabaseUser(database);

  await database.transaction(async (transaction) => {
    const [existing] = await transaction.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), ne(tasks.status, "archived"))).limit(1);
    if (!existing) throw new TaskNotFoundError("That task no longer exists.");

    await transaction.update(tasks).set({ status: "archived", updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
    await transaction.insert(activityLogs).values({
      userId: user.id,
      action: "task.archived",
      targetType: "task",
      targetId: existing.id,
      summary: `Archived task: ${existing.title}`,
      metadata: { previousStatus: existing.status },
    });
  });
}
