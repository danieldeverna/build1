import { NextRequest, NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import { revokeGoogleToken } from "@/integrations/google-calendar/oauth";
import { GOOGLE_CALENDAR_SESSION_COOKIE, googleCalendarCookieOptions, unsealGoogleCalendarSession } from "@/integrations/google-calendar/session";
import { isTrustedMutationRequest } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Untrusted request origin" }, { status: 403 });

  const session = unsealGoogleCalendarSession(request.cookies.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value);
  if (session) {
    try {
      await revokeGoogleToken(session.refreshToken);
    } catch {
      // Local credentials are still removed if Google is temporarily unavailable.
    }
  }

  const response = NextResponse.redirect(new URL("/settings?calendar=disconnected", request.nextUrl.origin), 303);
  response.cookies.set(GOOGLE_CALENDAR_SESSION_COOKIE, "", googleCalendarCookieOptions(0));
  return response;
}
