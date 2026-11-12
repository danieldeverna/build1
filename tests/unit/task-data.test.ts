// @vitest-environment node

import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/db/client";
import { activityLogs, users } from "@/db/schema";
import { archiveTaskForCurrentViewer, createTaskForCurrentViewer, listTasksForCurrentViewer, setTaskCompletionForCurrentViewer, updateTaskForCurrentViewer } from "@/data/tasks";

const auth = vi.hoisted(() => ({ getCurrentViewer: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentViewer: auth.getCurrentViewer }));

describe("task data access", () => {
  let client: PGlite;
  let database: Database;

  beforeEach(async () => {
    auth.getCurrentViewer.mockReset();
    auth.getCurrentViewer.mockResolvedValue({ id: "google-user", email: "daniel@example.com", name: "Daniel", image: null });
    client = new PGlite();
    const testDatabase = drizzle(client, { schema });
    await migrate(testDatabase, { migrationsFolder: path.resolve("drizzle") });
    database = testDatabase as unknown as Database;
  });

  it("persists the complete task lifecycle and hides archived tasks", async () => {
    const created = await createTaskForCurrentViewer({ title: "Write memo", category: "academic", dueDate: "2026-11-12" }, database);
    expect(created).toMatchObject({ title: "Write memo", dueDate: "2026-11-12", status: "open" });

    const updated = await updateTaskForCurrentViewer(created.id, { title: "Write final memo", category: "projects", dueDate: null, priority: "high", estimatedMinutes: 45 }, database);
    expect(updated).toMatchObject({ title: "Write final memo", category: "projects", priority: "high" });

    expect((await setTaskCompletionForCurrentViewer(created.id, true, database)).status).toBe("completed");
    expect((await setTaskCompletionForCurrentViewer(created.id, false, database)).status).toBe("open");
    await archiveTaskForCurrentViewer(created.id, database);
    expect(await listTasksForCurrentViewer(database)).toEqual([]);

    const logs = await database.select({ action: activityLogs.action }).from(activityLogs);
    expect(logs.map((entry) => entry.action)).toEqual(["task.created", "task.updated", "task.completed", "task.reopened", "task.archived"]);
  });

  it("does not let a different signed-in account mutate any task lifecycle state", async () => {
    const created = await createTaskForCurrentViewer({ title: "Private task", category: "projects" }, database);
    auth.getCurrentViewer.mockResolvedValue({ id: "other-user", email: "other@example.com", name: "Other", image: null });
    await expect(updateTaskForCurrentViewer(created.id, { title: "Stolen task", category: "projects" }, database)).rejects.toThrow("That task no longer exists");
    await expect(setTaskCompletionForCurrentViewer(created.id, true, database)).rejects.toThrow("That task no longer exists");
    await expect(archiveTaskForCurrentViewer(created.id, database)).rejects.toThrow("That task no longer exists");

    auth.getCurrentViewer.mockResolvedValue({ id: "google-user", email: "daniel@example.com", name: "Daniel", image: null });
    expect(await listTasksForCurrentViewer(database)).toEqual([expect.objectContaining({ id: created.id, title: "Private task", status: "open" })]);
  });

  it("does not create a database user during a read-only page load", async () => {
    expect(await listTasksForCurrentViewer(database)).toEqual([]);
    expect(await database.select().from(users)).toEqual([]);
  });
});
