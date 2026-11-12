"use client";

import {
  Archive,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDashed,
  Clock3,
  Layers3,
  Link2,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { archiveTaskAction, createTaskAction, setTaskCompletionAction, updateTaskAction } from "@/app/(app)/work/actions";
import {
  filterTasks,
  incompleteTaskCounts,
  taskInputSchema,
  type Task,
  type TaskCategory,
  type TaskInput,
} from "@/domain/tasks";
import { cn } from "@/lib/cn";

type Tab = "all" | TaskCategory;

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "all", label: "All work", icon: Layers3 },
  { id: "academic", label: "Academic", icon: BookOpenCheck },
  { id: "recruiting", label: "Recruiting", icon: BriefcaseBusiness },
  { id: "projects", label: "Projects", icon: CircleDashed },
];

const categoryLabels: Record<TaskCategory, string> = {
  academic: "Academic",
  recruiting: "Recruiting",
  projects: "Projects",
};

const categoryStyles: Record<TaskCategory, string> = {
  academic: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  recruiting: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  projects: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export function WorkBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<Tab>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | "new" | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const counts = incompleteTaskCounts(tasks);
  const visibleTasks = useMemo(
    () => filterTasks(tasks, tab).filter((task) => showCompleted || task.status === "open"),
    [tasks, tab, showCompleted],
  );

  function saveTask(input: TaskInput, id?: string) {
    setMutationError(null);
    startTransition(async () => {
      const result = id ? await updateTaskAction(id, input) : await createTaskAction(input);
      if (!result.ok || !result.task) {
        setMutationError(result.ok ? "Jarvis did not return the saved task." : result.error);
        return;
      }
      setTasks((current) => id ? current.map((task) => task.id === id ? result.task! : task) : [result.task!, ...current]);
      setEditingTask(null);
    });
  }

  function toggleTask(task: Task) {
    setMutationError(null);
    startTransition(async () => {
      const result = await setTaskCompletionAction(task.id, task.status !== "completed");
      if (!result.ok || !result.task) {
        setMutationError(result.ok ? "Jarvis did not return the updated task." : result.error);
        return;
      }
      setTasks((current) => current.map((candidate) => candidate.id === task.id ? result.task! : candidate));
    });
  }

  function removeTask(id: string) {
    setMutationError(null);
    startTransition(async () => {
      const result = await archiveTaskAction(id);
      if (!result.ok) {
        setMutationError(result.error);
        return;
      }
      setTasks((current) => current.filter((task) => task.id !== id));
    });
  }

  function beginEdit(task: Task | "new") {
    setMutationError(null);
    setEditingTask(task);
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="card h-fit p-2">
          <div className="space-y-1" role="tablist" aria-label="Work categories">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              const count = counts[item.id];
              return (
                <button key={item.id} role="tab" aria-selected={active} onClick={() => setTab(item.id)} className={cn("focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface-subtle)]", active && "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]")}>
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  <span className={cn("grid min-w-6 place-items-center rounded-full bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[0.65rem]", active && "bg-[var(--surface)]")}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mx-3 my-3 border-t" />
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted)]">
            <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} className="accent-[var(--accent)]" />
            Show completed
          </label>
        </aside>

        <section className="card min-h-[34rem] overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.035em]">{tabs.find((item) => item.id === tab)?.label}</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{visibleTasks.length} {visibleTasks.length === 1 ? "item" : "items"}</p>
            </div>
            <button disabled={isPending} onClick={() => beginEdit("new")} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-[var(--accent)]"><Plus size={15} /> Add task</button>
          </div>

          {mutationError && <p role="alert" className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{mutationError}</p>}

          {tab === "academic" && (
            <div className="mx-5 mt-5 flex flex-col gap-3 rounded-xl border border-dashed bg-[var(--surface-subtle)] p-4 sm:mx-6 sm:flex-row sm:items-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--muted)]"><Link2 size={16} /></span>
              <div className="flex-1"><p className="text-sm font-semibold">Canvas is not connected</p><p className="mt-0.5 text-xs text-[var(--muted)]">Assignments will appear here as read-only items after setup.</p></div>
              <button disabled className="rounded-lg border px-3 py-2 text-xs font-semibold text-[var(--muted-2)]">Setup pending</button>
            </div>
          )}

          {visibleTasks.length ? (
            <div className="divide-y px-5 sm:px-6">
              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} disabled={isPending} onToggle={() => toggleTask(task)} onEdit={() => beginEdit(task)} onDelete={() => removeTask(task.id)} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center p-8 text-center">
              <div><span className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--muted)]"><Check size={18} /></span><p className="font-semibold">Nothing waiting here</p><p className="mt-1 text-sm text-[var(--muted)]">Add a task when something needs your attention.</p></div>
            </div>
          )}
        </section>
      </div>

      {editingTask && <TaskDialog task={editingTask === "new" ? undefined : editingTask} defaultCategory={tab === "all" ? "academic" : tab} pending={isPending} onClose={() => setEditingTask(null)} onSave={saveTask} />}
    </>
  );
}

function TaskRow({ task, disabled, onToggle, onEdit, onDelete }: { task: Task; disabled: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const due = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : null;
  const overdue = due && isPast(due) && !isToday(due) && task.status === "open";
  return (
    <article className={cn("group flex items-start gap-3 py-4", task.status === "completed" && "opacity-55")}>
      <button disabled={disabled} onClick={onToggle} className={cn("focus-ring mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 text-white transition disabled:cursor-wait", task.status === "completed" ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)] hover:border-[var(--accent)]")} aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Complete ${task.title}`}>{task.status === "completed" && <Check size={12} strokeWidth={3} />}</button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("text-sm font-semibold", task.status === "completed" && "line-through")}>{task.title}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-bold", categoryStyles[task.category])}>{categoryLabels[task.category]}</span>
          {task.priority === "high" && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[0.62rem] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">High</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          {due && <span className={cn("flex items-center gap-1.5", overdue && "font-semibold text-rose-600")}><CalendarClock size={13} />{isToday(due) ? "Today" : format(due, "MMM d")}</span>}
          {task.estimatedMinutes && <span className="flex items-center gap-1.5"><Clock3 size={13} />{task.estimatedMinutes} min</span>}
          {!due && !task.estimatedMinutes && <span>Ongoing · no due date</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button disabled={disabled} onClick={onEdit} className="focus-ring grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] disabled:cursor-wait" aria-label={`Edit ${task.title}`}><Pencil size={14} /></button>
        <button disabled={disabled} onClick={onDelete} className="focus-ring grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-amber-50 hover:text-amber-700 disabled:cursor-wait dark:hover:bg-amber-950" aria-label={`Archive ${task.title}`}><Archive size={14} /></button>
        <ChevronRight className="hidden text-[var(--muted-2)] sm:block" size={15} />
      </div>
    </article>
  );
}

function TaskDialog({ task, defaultCategory, pending, onClose, onSave }: { task?: Task; defaultCategory: TaskCategory; pending: boolean; onClose: () => void; onSave: (input: TaskInput, id?: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  function submit(formData: FormData) {
    const minutes = String(formData.get("estimatedMinutes") ?? "");
    const result = taskInputSchema.safeParse({
      title: formData.get("title"),
      category: formData.get("category"),
      dueDate: String(formData.get("dueDate") ?? "") || null,
      priority: String(formData.get("priority") ?? "") || null,
      estimatedMinutes: minutes ? Number(minutes) : null,
      notes: String(formData.get("notes") ?? "") || null,
    });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Check the task details."); return; }
    onSave(result.data, task?.id);
  }
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{task ? "Update work" : "Capture work"}</p><h2 id="task-dialog-title" className="text-xl font-bold tracking-[-0.04em]">{task ? "Edit task" : "Add a task"}</h2><p className="mt-1 text-sm text-[var(--muted)]">Only a title and category are required.</p></div><button onClick={onClose} className="focus-ring grid size-9 place-items-center rounded-full hover:bg-[var(--surface-subtle)]" aria-label="Close"><X size={17} /></button></div>
        <form onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold">Title<input name="title" required autoFocus defaultValue={task?.title} placeholder="What needs to get done?" className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3.5 py-3 text-sm" /></label>
          <label className="block text-xs font-semibold">Category<select name="category" defaultValue={task?.category ?? defaultCategory} className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3.5 py-3 text-sm"><option value="academic">Academic</option><option value="recruiting">Recruiting</option><option value="projects">Projects</option></select></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-semibold">Due date <span className="font-normal text-[var(--muted)]">optional</span><input name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-sm" /></label>
            <label className="block text-xs font-semibold">Priority <span className="font-normal text-[var(--muted)]">optional</span><select name="priority" defaultValue={task?.priority ?? ""} className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-sm"><option value="">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="block text-xs font-semibold">Minutes <span className="font-normal text-[var(--muted)]">optional</span><input name="estimatedMinutes" type="number" min="1" max="1440" defaultValue={task?.estimatedMinutes ?? ""} placeholder="30" className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-sm" /></label>
          </div>
          <label className="block text-xs font-semibold">Notes or link <span className="font-normal text-[var(--muted)]">optional</span><textarea name="notes" defaultValue={task?.notes ?? ""} rows={3} placeholder="Context, next step, or URL" className="mt-1.5 w-full resize-none rounded-xl border bg-[var(--surface)] px-3.5 py-3 text-sm" /></label>
          {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" disabled={pending} onClick={onClose} className="focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--muted)] disabled:cursor-wait">Cancel</button><button disabled={pending} className="focus-ring rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-[var(--accent)]">{pending ? "Saving…" : task ? "Save changes" : "Add task"}</button></div>
        </form>
      </div>
    </div>
  );
}
