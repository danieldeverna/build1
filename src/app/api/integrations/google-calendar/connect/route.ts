import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import { buildGoogleAuthorizationUrl, getGoogleCalendarOAuthConfig } from "@/integrations/google-calendar/oauth";
import { GOOGLE_CALENDAR_STATE_COOKIE, googleCalendarCookieOptions } from "@/integrations/google-calendar/session";

export async function GET(request: Request) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.redirect(new URL("/sign-in", request.url));

  try {
    const state = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(buildGoogleAuthorizationUrl(getGoogleCalendarOAuthConfig(), state));
    response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, state, googleCalendarCookieOptions(60 * 10));
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?calendar=setup_error", request.url));
  }
}
