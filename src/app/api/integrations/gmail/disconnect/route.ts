import { NextRequest, NextResponse } from "next/server";
import { getCurrentViewer } from "@/lib/auth";
import { revokeGmailToken } from "@/integrations/gmail/oauth";
import { GMAIL_SESSION_COOKIE, gmailCookieOptions, unsealGmailSession } from "@/integrations/gmail/session";
import { isTrustedMutationRequest } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isTrustedMutationRequest(request)) return NextResponse.json({ error: "Untrusted request origin" }, { status: 403 });
  const session = unsealGmailSession(request.cookies.get(GMAIL_SESSION_COOKIE)?.value);
  if (session) {
    try { await revokeGmailToken(session.refreshToken); } catch { /* clear local credentials even if Google is unavailable */ }
  }
  const response = NextResponse.redirect(new URL("/settings?gmail=disconnected", request.nextUrl.origin), 303);
  response.cookies.set(GMAIL_SESSION_COOKIE, "", gmailCookieOptions(0));
  return response;
}
