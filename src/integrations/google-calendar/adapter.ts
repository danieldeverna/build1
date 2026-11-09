import "server-only";
import type { GoogleCalendarAdapter } from "@/integrations/contracts";
import { normalizeGoogleEvent, type GoogleEvent } from "@/integrations/google-calendar/normalize";

const API_ROOT = "https://www.googleapis.com/calendar/v3";

type GoogleEventsResponse = { items?: GoogleEvent[]; nextPageToken?: string; error?: { message?: string } };
type GoogleCreatedEvent = GoogleEvent & { htmlLink?: string };

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

  async insertEvent(input: { idempotencyKey: string; title: string; start: string; end: string; notes?: string; location?: string }) {
    const lookup = new URL(`${API_ROOT}/calendars/primary/events`);
    lookup.searchParams.append("privateExtendedProperty", `jarvisId=${input.idempotencyKey}`);
    lookup.searchParams.set("maxResults", "1");
    const existing = await this.request<GoogleEventsResponse>(lookup);
    const existingEvent = existing.items?.[0] as GoogleCreatedEvent | undefined;
    if (existingEvent?.id) return { externalId: existingEvent.id, url: existingEvent.htmlLink ?? "" };

    const url = new URL(`${API_ROOT}/calendars/primary/events`);
    const created = await this.request<GoogleCreatedEvent>(url, {
      method: "POST",
      body: JSON.stringify({
        summary: input.title,
        description: input.notes,
        location: input.location,
        start: { dateTime: input.start },
        end: { dateTime: input.end },
        extendedProperties: { private: { jarvisOwned: "true", jarvisId: input.idempotencyKey } },
      }),
    });
    if (!created.id) throw new Error("Google created the event without an identifier");
    return { externalId: created.id, url: created.htmlLink ?? "" };
  }
}
