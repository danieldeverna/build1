import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { GoogleCalendarApiAdapter } from "@/integrations/google-calendar/adapter";
import { getGoogleCalendarOAuthConfig, refreshGoogleAccessToken } from "@/integrations/google-calendar/oauth";
import {
  GOOGLE_CALENDAR_SESSION_COOKIE,
  googleCalendarCookieOptions,
  sealGoogleCalendarSession,
  unsealGoogleCalendarSession,
  type GoogleCalendarSession,
} from "@/integrations/google-calendar/session";
import { getCurrentViewer } from "@/lib/auth";
import { isTrustedMutationRequest } from "@/lib/request-security";

const MAX_SYNC_WINDOW_MS = 550 * 24 * 60 * 60 * 1000;

async function getFreshSession(request: NextRequest) {
  const session = unsealGoogleCalendarSession(request.cookies.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value);
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return { session, refreshed: false };
  const refreshed = await refreshGoogleAccessToken(getGoogleCalendarOAuthConfig(), session.refreshToken);
  return { session: { ...session, ...refreshed } satisfies GoogleCalendarSession, refreshed: true };
}

function jsonWithSession(body: unknown, status: number, connection: Awaited<ReturnType<typeof getFreshSession>>) {
  const response = NextResponse.json(body, { status });
  if (connection?.refreshed) {
    response.cookies.set(GOOGLE_CALENDAR_SESSION_COOKIE, sealGoogleCalendarSession(connection.session), googleCalendarCookieOptions());
  }
  return response;
}

export async function GET(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const connection = await getFreshSession(request);
    if (!connection) return NextResponse.json({ error: "Google Calendar is not connected" }, { status: 409 });
    const timeMin = new Date(request.nextUrl.searchParams.get("timeMin") ?? "");
    const timeMax = new Date(request.nextUrl.searchParams.get("timeMax") ?? "");
    if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime()) || timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > MAX_SYNC_WINDOW_MS) {
      return jsonWithSession({ error: "A valid timeMin and timeMax are required" }, 400, connection);
    }
    const events = await new GoogleCalendarApiAdapter(connection.session.accessToken).listEvents({ start: timeMin, end: timeMax });
    return jsonWithSession({ events, syncedAt: new Date().toISOString() }, 200, connection);
  } catch {
    return NextResponse.json({ error: "Google Calendar could not be synchronized. Reconnect from Settings." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Untrusted request origin" }, { status: 403 });
  try {
    const connection = await getFreshSession(request);
    if (!connection) return NextResponse.json({ error: "Google Calendar is not connected" }, { status: 409 });
    const body = await request.json() as { title?: string; start?: string; end?: string; location?: string; notes?: string; idempotencyKey?: string };
    const title = body.title?.trim();
    const location = body.location?.trim() || undefined;
    const notes = body.notes?.trim() || undefined;
    const idempotencyKey = body.idempotencyKey?.trim() || randomUUID();
    const start = new Date(body.start ?? "");
    const end = new Date(body.end ?? "");
    if (!title || title.length > 200 || (location?.length ?? 0) > 500 || (notes?.length ?? 0) > 4000 || idempotencyKey.length > 128 || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return jsonWithSession({ error: "A title and valid start/end times are required" }, 400, connection);
    }
    const result = await new GoogleCalendarApiAdapter(connection.session.accessToken).insertEvent({
      idempotencyKey,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      location,
      notes,
    });
    return jsonWithSession({
      event: {
        id: result.externalId,
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: false,
        source: "jarvis",
        location,
        color: "blue",
      },
      url: result.url,
    }, 201, connection);
  } catch {
    return NextResponse.json({ error: "The event could not be added to Google Calendar" }, { status: 502 });
  }
}
