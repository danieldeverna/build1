import type { CanvasAdapter, GoogleCalendarAdapter, WeatherAdapter } from "@/integrations/contracts";
import { getMockEvents } from "@/lib/mock-data";

export const mockGoogleCalendarAdapter: GoogleCalendarAdapter = {
  async listEvents() { return getMockEvents(); },
  async insertEvent(input) { return { externalId: `mock-${input.idempotencyKey}`, url: "https://calendar.google.com" }; },
};
export const disconnectedCanvasAdapter: CanvasAdapter = { async listAssignments() { return []; } };
export const mockWeatherAdapter: WeatherAdapter = { async getToday() { return { temperature: 63, high: 68, low: 51, condition: "Partly cloudy", precipitationChance: 12 }; } };
