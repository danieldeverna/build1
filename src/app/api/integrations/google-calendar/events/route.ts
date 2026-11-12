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

export async function POST() {
  return NextResponse.json({ error: "Jarvis keeps calendar changes on this platform and does not write to Google Calendar." }, { status: 405 });
}
