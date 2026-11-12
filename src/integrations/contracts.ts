import type { CalendarEvent } from "@/domain/calendar";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "stale" | "expired" | "error";
export type ProviderStatus = { provider: "google" | "canvas" | "weather"; state: ConnectionState; lastSyncedAt: string | null; message: string };
export type ExternalAssignment = { id: string; courseId: string; courseName: string; title: string; dueAt: string | null; url: string; state: string };

export interface GoogleCalendarAdapter {
  listEvents(input: { start: Date; end: Date }): Promise<CalendarEvent[]>;
}
export interface CanvasAdapter { listAssignments(input: { from: Date; to: Date }): Promise<ExternalAssignment[]>; }
export interface WeatherAdapter { getToday(input: { latitude: number; longitude: number }): Promise<{ temperature: number; high: number; low: number; condition: string; precipitationChance: number }>; }
