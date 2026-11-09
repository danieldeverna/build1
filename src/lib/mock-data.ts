import { addDays, set } from "date-fns";
import type { CalendarEvent } from "@/domain/calendar";
import { defaultFitnessProfile, plannedWorkoutToCalendarEvent, scheduleFitnessWeek } from "@/domain/fitness";
import type { Task } from "@/domain/tasks";

function at(dayOffset: number, hours: number, minutes = 0) {
  return set(addDays(new Date(), dayOffset), { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString();
}

function getMockCommitments(): CalendarEvent[] {
  return [
    { id: "event-1", title: "Product strategy seminar", start: at(0, 9, 30), end: at(0, 10, 45), allDay: false, source: "google", location: "Monroe Hall · 201", color: "violet" },
    { id: "event-2", title: "Deep work · portfolio review", start: at(0, 12), end: at(0, 13, 30), allDay: false, source: "jarvis", location: "Library", color: "blue" },
    { id: "event-3", title: "Coffee with Maya", start: at(0, 15), end: at(0, 15, 45), allDay: false, source: "google", location: "The Roasted Boon", color: "emerald" },
    { id: "event-4", title: "Recruiting follow-ups", start: at(1, 10), end: at(1, 11), allDay: false, source: "jarvis", color: "amber" },
    { id: "event-5", title: "Data structures lecture", start: at(2, 13), end: at(2, 14, 15), allDay: false, source: "google", location: "Science Center", color: "violet" },
  ];
}

export function getMockFitnessPlan() {
  const commitments = getMockCommitments();
  return scheduleFitnessWeek({ weekStart: new Date(), events: commitments, profile: defaultFitnessProfile });
}

export function getMockEvents(): CalendarEvent[] {
  return [...getMockCommitments(), ...getMockFitnessPlan().map(plannedWorkoutToCalendarEvent)];
}

export const mockTasks: Task[] = [
  { id: "task-1", title: "Submit behavioral economics response", category: "academic", status: "open", dueDate: addDays(new Date(), 1).toISOString().slice(0, 10), priority: "high", estimatedMinutes: 45, notes: null, source: "build1" },
  { id: "task-2", title: "Follow up with Northstar recruiter", category: "recruiting", status: "open", dueDate: addDays(new Date(), 2).toISOString().slice(0, 10), priority: "medium", estimatedMinutes: 20, notes: "Reference the product internship conversation.", source: "build1" },
  { id: "task-3", title: "Refine Jarvis calendar interactions", category: "projects", status: "open", dueDate: null, priority: null, estimatedMinutes: 90, notes: null, source: "build1" },
  { id: "task-4", title: "Review statistics problem set", category: "academic", status: "completed", dueDate: addDays(new Date(), -1).toISOString().slice(0, 10), priority: "medium", estimatedMinutes: 60, notes: null, source: "build1" },
];
