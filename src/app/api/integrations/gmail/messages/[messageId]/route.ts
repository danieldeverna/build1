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

export async function GET(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const connection = await getFreshSession(request);
    if (!connection) return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
    const { messageId } = await params;
    if (!/^[A-Za-z0-9_-]+$/.test(messageId)) return NextResponse.json({ error: "Invalid message identifier" }, { status: 400 });
    const message = await new GmailApiAdapter(connection.session.accessToken).readMessage(messageId);
    const response = NextResponse.json({ message });
    if (connection.refreshed) response.cookies.set(GMAIL_SESSION_COOKIE, sealGmailSession(connection.session), gmailCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Gmail message could not be read. Reconnect from Settings." }, { status: 502 });
  }
}
