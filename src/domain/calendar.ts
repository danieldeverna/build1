export type CalendarSource = "google" | "jarvis" | "canvas";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  source: CalendarSource;
  location?: string;
  color: "blue" | "violet" | "amber" | "emerald" | "slate";
};

export type PositionedEvent = CalendarEvent & {
  top: number;
  height: number;
};

export function positionDayEvent(
  event: CalendarEvent,
  dayStartHour = 7,
  pixelsPerHour = 76,
): PositionedEvent {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const visibleStart = dayStartHour * 60;

  return {
    ...event,
    top: Math.max(0, ((startMinutes - visibleStart) / 60) * pixelsPerHour),
    height: Math.max(34, ((endMinutes - startMinutes) / 60) * pixelsPerHour),
  };
}

export function eventOccursOn(event: CalendarEvent, date: Date) {
  const start = new Date(event.start);
  return (
    start.getFullYear() === date.getFullYear() &&
    start.getMonth() === date.getMonth() &&
    start.getDate() === date.getDate()
  );
}

export function getCurrentTimeOffset(
  now: Date,
  dayStartHour = 7,
  pixelsPerHour = 76,
) {
  const minutes = now.getHours() * 60 + now.getMinutes() - dayStartHour * 60;
  return (minutes / 60) * pixelsPerHour;
}
