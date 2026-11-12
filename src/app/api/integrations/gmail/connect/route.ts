import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import { buildGmailAuthorizationUrl, getGmailOAuthConfig } from "@/integrations/gmail/oauth";
import { GMAIL_STATE_COOKIE, gmailCookieOptions } from "@/integrations/gmail/session";

export async function GET(request: Request) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.redirect(new URL("/sign-in", request.url));
  try {
    const state = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(buildGmailAuthorizationUrl(getGmailOAuthConfig(), state));
    response.cookies.set(GMAIL_STATE_COOKIE, state, gmailCookieOptions(60 * 10));
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?gmail=setup_error", request.url));
  }
}
