import { NextRequest, NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import { exchangeGmailAuthorizationCode, getGmailAccountEmail, getGmailOAuthConfig, revokeGmailToken, type GmailTokenSet } from "@/integrations/gmail/oauth";
import { GMAIL_SESSION_COOKIE, GMAIL_STATE_COOKIE, gmailCookieOptions, sealGmailSession } from "@/integrations/gmail/session";

function settingsRedirect(request: NextRequest, status: string) {
  return new URL(`/settings?gmail=${status}`, request.nextUrl.origin);
}

function redirectAndClearState(request: NextRequest, status: string) {
  const response = NextResponse.redirect(settingsRedirect(request, status));
  response.cookies.set(GMAIL_STATE_COOKIE, "", gmailCookieOptions(0));
  return response;
}

export async function GET(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));
  const expectedState = request.cookies.get(GMAIL_STATE_COOKIE)?.value;
  const returnedState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.searchParams.get("error")) return redirectAndClearState(request, "cancelled");
  if (!code || !expectedState || returnedState !== expectedState) return redirectAndClearState(request, "invalid_state");

  let tokens: GmailTokenSet | null = null;
  try {
    tokens = await exchangeGmailAuthorizationCode(getGmailOAuthConfig(), code);
    const email = await getGmailAccountEmail(tokens.accessToken);
    const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
    if (allowedEmail && email !== allowedEmail) {
      try { await revokeGmailToken(tokens.refreshToken); } catch { /* rejected credentials are never stored */ }
      return redirectAndClearState(request, "wrong_account");
    }
    const response = NextResponse.redirect(settingsRedirect(request, "connected"));
    response.cookies.set(GMAIL_SESSION_COOKIE, sealGmailSession({ ...tokens, email, connectedAt: new Date().toISOString() }), gmailCookieOptions());
    response.cookies.set(GMAIL_STATE_COOKIE, "", gmailCookieOptions(0));
    return response;
  } catch {
    if (tokens) {
      try { await revokeGmailToken(tokens.refreshToken); } catch { /* rejected credentials are never stored */ }
    }
    return redirectAndClearState(request, "oauth_error");
  }
}
