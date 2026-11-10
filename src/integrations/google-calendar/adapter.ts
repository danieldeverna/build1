import "server-only";
import type { GoogleCalendarAdapter } from "@/integrations/contracts";
import { normalizeGoogleEvent, type GoogleEvent } from "@/integrations/google-calendar/normalize";

const API_ROOT = "https://www.googleapis.com/calendar/v3";

type GoogleEventsResponse = { items?: GoogleEvent[]; nextPageToken?: string; error?: { message?: string } };

export class GoogleCalendarApiAdapter implements GoogleCalendarAdapter {
  constructor(private readonly accessToken: string) {}

  private async request<T>(url: URL, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        accept: "application/json",
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
    const result = await response.json() as T & { error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message || `Google Calendar request failed (${response.status})`);
    return result;
  }

  async listEvents({ start, end }: { start: Date; end: Date }) {
    const events: GoogleEvent[] = [];
    let pageToken: string | undefined;
    do {
      const url = new URL(`${API_ROOT}/calendars/primary/events`);
      url.searchParams.set("timeMin", start.toISOString());
      url.searchParams.set("timeMax", end.toISOString());
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "2500");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const result = await this.request<GoogleEventsResponse>(url);
      events.push(...(result.items ?? []));
      pageToken = result.nextPageToken;
    } while (pageToken);
    return events.map(normalizeGoogleEvent).filter((event) => event !== null);
  }
}
