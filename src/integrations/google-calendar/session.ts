import "server-only";
import { decryptCredential, encryptCredential } from "@/lib/credential-crypto";

export const GOOGLE_CALENDAR_SESSION_COOKIE = "jarvis_google_calendar";
export const GOOGLE_CALENDAR_STATE_COOKIE = "jarvis_google_calendar_state";

export type GoogleCalendarSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  email: string;
  connectedAt: string;
};

export function sealGoogleCalendarSession(session: GoogleCalendarSession) {
  return encryptCredential(JSON.stringify(session));
}

export function unsealGoogleCalendarSession(value?: string | null): GoogleCalendarSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decryptCredential(value)) as Partial<GoogleCalendarSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt || !parsed.email || !parsed.connectedAt || !Array.isArray(parsed.scopes)) return null;
    return parsed as GoogleCalendarSession;
  } catch {
    return null;
  }
}

export function googleCalendarCookieOptions(maxAge = 60 * 60 * 24 * 180) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge,
  };
}
