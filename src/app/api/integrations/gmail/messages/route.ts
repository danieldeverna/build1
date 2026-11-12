import { NextRequest, NextResponse } from "next/server";
import { GmailApiAdapter } from "@/integrations/gmail/adapter";
import { getGmailOAuthConfig, refreshGmailAccessToken } from "@/integrations/gmail/oauth";
import { GMAIL_SESSION_COOKIE, gmailCookieOptions, sealGmailSession, unsealGmailSession, type GmailSession } from "@/integrations/gmail/session";
import { getCurrentViewer } from "@/lib/auth";

async function getFreshSession(request: NextRequest) {
  const session = unsealGmailSession(request.cookies.get(GMAIL_SESSION_COOKIE)?.value);
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return { session, refreshed: false };
  const refreshed = await refreshGmailAccessToken(getGmailOAuthConfig(), session.refreshToken);
  return { session: { ...session, ...refreshed } satisfies GmailSession, refreshed: true };
}

function responseWithSession(body: unknown, status: number, connection: Awaited<ReturnType<typeof getFreshSession>>) {
  const response = NextResponse.json(body, { status });
  if (connection?.refreshed) response.cookies.set(GMAIL_SESSION_COOKIE, sealGmailSession(connection.session), gmailCookieOptions());
  return response;
}

export async function GET(request: NextRequest) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const connection = await getFreshSession(request);
    if (!connection) return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "12");
    const messages = await new GmailApiAdapter(connection.session.accessToken).listRecentMessages(Number.isFinite(rawLimit) ? rawLimit : 12);
    return responseWithSession({ messages, syncedAt: new Date().toISOString() }, 200, connection);
  } catch {
    return NextResponse.json({ error: "Gmail could not be synchronized. Reconnect from Settings." }, { status: 502 });
  }
}
