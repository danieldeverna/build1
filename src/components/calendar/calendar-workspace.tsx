"use client";

import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { useState } from "react";
import { DayAgenda } from "@/components/dashboard/day-agenda";
import { eventOccursOn, positionDayEvent, type CalendarEvent } from "@/domain/calendar";
import { cn } from "@/lib/cn";

type CalendarView = "day" | "week" | "month";
const views: CalendarView[] = ["day", "week", "month"];
const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_HEIGHT = 58;

const colorStyles = {
  blue: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  violet: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100",
  amber: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  slate: "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
};

export function CalendarWorkspace({ initialEvents, initialNew = false }: { initialEvents: CalendarEvent[]; initialNew?: boolean }) {
  const [view, setView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [draftOpen, setDraftOpen] = useState(initialNew);

  const title = view === "month" ? format(selectedDate, "MMMM yyyy") : view === "week" ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d, yyyy")}` : format(selectedDate, "EEEE, MMMM d");

  function navigate(direction: -1 | 1) {
    if (view === "month") setSelectedDate(direction === 1 ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
    else if (view === "week") setSelectedDate(direction === 1 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    else setSelectedDate(addDays(selectedDate, direction));
  }

  function addDraft(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const start = String(formData.get("start") ?? "");
    const end = String(formData.get("end") ?? "");
    if (!title || !start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) return;
    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: false,
        source: "jarvis",
        location: String(formData.get("location") ?? "") || undefined,
        color: "blue",
      },
    ]);
    setDraftOpen(false);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-[var(--surface)] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="focus-ring grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)]" aria-label="Previous period"><ChevronLeft size={17} /></button>
          <button onClick={() => setSelectedDate(new Date())} className="focus-ring rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)]">Today</button>
          <button onClick={() => navigate(1)} className="focus-ring grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)]" aria-label="Next period"><ChevronRight size={17} /></button>
          <h2 className="ml-2 text-sm font-bold sm:text-base">{title}</h2>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-lg bg-[var(--surface-subtle)] p-1">
            {views.map((item) => (
              <button key={item} onClick={() => setView(item)} className={cn("focus-ring rounded-md px-3 py-1.5 text-xs font-semibold capitalize text-[var(--muted)]", view === item && "bg-[var(--surface)] text-[var(--foreground)] shadow-sm")}>{item}</button>
            ))}
          </div>
          <button onClick={() => setDraftOpen(true)} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-semibold text-white dark:bg-[var(--accent)]"><Plus size={14} /> <span className="hidden sm:inline">New draft</span></button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        <CloudOff size={15} className="shrink-0" />
        Preview mode · Google Calendar is not connected. Drafts stay local and cannot publish yet.
      </div>

      <section className="card overflow-hidden">
        {view === "day" && <div className="p-3 sm:p-5"><DayAgenda events={events} date={selectedDate} /></div>}
        {view === "week" && <WeekView date={selectedDate} events={events} onSelectDate={(date) => { setSelectedDate(date); setView("day"); }} />}
        {view === "month" && <MonthView date={selectedDate} events={events} onSelectDate={(date) => { setSelectedDate(date); setView("day"); }} />}
      </section>

      {draftOpen && <DraftDialog selectedDate={selectedDate} onClose={() => setDraftOpen(false)} onSubmit={addDraft} />}
    </>
  );
}

function WeekView({ date, events, onSelectDate }: { date: Date; events: CalendarEvent[]; onSelectDate: (date: Date) => void }) {
  const days = eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) });
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  return (
    <div className="overflow-auto">
      <div className="min-w-[58rem]">
        <div className="sticky top-0 z-10 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b bg-[var(--surface)]">
          <div />
          {days.map((day) => (
            <button key={day.toISOString()} onClick={() => onSelectDate(day)} className="focus-ring border-l py-3 text-center hover:bg-[var(--surface-subtle)]">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{format(day, "EEE")}</p>
              <span className={cn("mx-auto mt-1 grid size-8 place-items-center rounded-full text-sm font-bold", isSameDay(day, new Date()) && "bg-[var(--accent)] text-white")}>{format(day, "d")}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="relative" style={{ height: totalHeight }}>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => <span key={index} className="absolute right-2 -translate-y-1/2 text-[0.62rem] font-medium text-[var(--muted-2)]" style={{ top: index * HOUR_HEIGHT }}>{format(new Date(2026, 0, 1, START_HOUR + index), "h a")}</span>)}
          </div>
          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-l" style={{ height: totalHeight }}>
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => <div key={index} className="absolute inset-x-0 border-t" style={{ top: index * HOUR_HEIGHT }} />)}
              {events.filter((event) => !event.allDay && eventOccursOn(event, day)).map((event) => {
                const positioned = positionDayEvent(event, START_HOUR, HOUR_HEIGHT);
                return <article key={event.id} className={cn("absolute inset-x-1 overflow-hidden rounded-lg border p-1.5 text-[0.65rem] shadow-sm", colorStyles[event.color])} style={{ top: positioned.top + 2, height: Math.max(28, positioned.height - 4) }}><p className="truncate font-bold">{event.title}</p><p className="mt-0.5 truncate opacity-60">{format(new Date(event.start), "h:mm a")}</p></article>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({ date, events, onSelectDate }: { date: Date; events: CalendarEvent[]; onSelectDate: (date: Date) => void }) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) });
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[48rem]">
        <div className="grid grid-cols-7 border-b">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="py-3 text-center text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((event) => eventOccursOn(event, day));
            return (
              <button key={day.toISOString()} onClick={() => onSelectDate(day)} className="focus-ring min-h-32 border-b border-r p-2 text-left align-top transition hover:bg-[var(--surface-subtle)]">
                <span className={cn("grid size-7 place-items-center rounded-full text-xs font-semibold", !isSameMonth(day, date) && "text-[var(--muted-2)]", isSameDay(day, new Date()) && "bg-[var(--accent)] text-white")}>{format(day, "d")}</span>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => <p key={event.id} className={cn("truncate rounded px-1.5 py-1 text-[0.62rem] font-semibold", colorStyles[event.color])}>{event.title}</p>)}
                  {dayEvents.length > 3 && <p className="px-1 text-[0.62rem] text-[var(--muted)]">+{dayEvents.length - 3} more</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DraftDialog({ selectedDate, onClose, onSubmit }: { selectedDate: Date; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const defaultStart = `${format(selectedDate, "yyyy-MM-dd")}T09:00`;
  const defaultEnd = `${format(selectedDate, "yyyy-MM-dd")}T10:00`;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="draft-title" className="card w-full max-w-lg p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div><span className="mb-3 grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><CalendarPlus size={19} /></span><h2 id="draft-title" className="text-xl font-bold tracking-[-0.04em]">Create event draft</h2><p className="mt-1 text-sm text-[var(--muted)]">This stays inside Jarvis until you publish it.</p></div>
          <button onClick={onClose} className="focus-ring grid size-9 place-items-center rounded-full hover:bg-[var(--surface-subtle)]" aria-label="Close"><X size={17} /></button>
        </div>
        <form action={onSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold">Title<input required name="title" autoFocus placeholder="What’s happening?" className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3.5 py-3 text-sm" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold">Starts<input required name="start" type="datetime-local" defaultValue={defaultStart} className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-sm" /></label>
            <label className="block text-xs font-semibold">Ends<input required name="end" type="datetime-local" defaultValue={defaultEnd} className="mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-sm" /></label>
          </div>
          <label className="block text-xs font-semibold">Location <span className="font-normal text-[var(--muted)]">optional</span><span className="relative mt-1.5 block"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} /><input name="location" placeholder="Add a location" className="w-full rounded-xl border bg-[var(--surface)] py-3 pl-9 pr-3 text-sm" /></span></label>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--muted)]">Cancel</button><button className="focus-ring rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[var(--accent)]">Save draft</button></div>
        </form>
      </div>
    </div>
  );
}
