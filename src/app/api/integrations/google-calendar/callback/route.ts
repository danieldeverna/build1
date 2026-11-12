import { NextRequest, NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import {
  exchangeGoogleAuthorizationCode,
  getGoogleAccountEmail,
  getGoogleCalendarOAuthConfig,
  revokeGoogleToken,
  type GoogleCalendarTokenSet,
} from "@/integrations/google-calendar/oauth";
import {
  GOOGLE_CALENDAR_SESSION_COOKIE,
  GOOGLE_CALENDAR_STATE_COOKIE,
  googleCalendarCookieOptions,
  sealGoogleCalendarSession,
} from "@/integrations/google-calendar/session";

function settingsRedirect(request: NextRequest, status: string) {
  return new URL(`/settings?calendar=${status}`, request.nextUrl.origin);
}

function redirectAndClearState(request: NextRequest, status: string) {
  const response = NextResponse.redirect(settingsRedirect(request, status));
  response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, "", googleCalendarCookieOptions(0));
  return response;
}

export async function GET(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));

  const expectedState = request.cookies.get(GOOGLE_CALENDAR_STATE_COOKIE)?.value;
  const returnedState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return redirectAndClearState(request, "cancelled");
  if (!code || !expectedState || returnedState !== expectedState) {
    return redirectAndClearState(request, "invalid_state");
  }

  let tokens: GoogleCalendarTokenSet | null = null;
  try {
    tokens = await exchangeGoogleAuthorizationCode(getGoogleCalendarOAuthConfig(), code);
    const email = await getGoogleAccountEmail(tokens.accessToken);
    const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
    if (allowedEmail && email !== allowedEmail) {
      try {
        await revokeGoogleToken(tokens.refreshToken);
      } catch {
        // The local connection is still rejected if Google is temporarily unavailable.
      }
      return redirectAndClearState(request, "wrong_account");
    }

    const response = NextResponse.redirect(settingsRedirect(request, "connected"));
    response.cookies.set(GOOGLE_CALENDAR_SESSION_COOKIE, sealGoogleCalendarSession({
      ...tokens,
      email,
      connectedAt: new Date().toISOString(),
    }), googleCalendarCookieOptions());
    response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, "", googleCalendarCookieOptions(0));
    return response;
  } catch {
    if (tokens) {
      try {
        await revokeGoogleToken(tokens.refreshToken);
      } catch {
        // The rejected connection is never stored locally.
      }
    }
    return redirectAndClearState(request, "oauth_error");
  }
}
