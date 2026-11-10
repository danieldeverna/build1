import "server-only";
import { decryptCredential, encryptCredential } from "@/lib/credential-crypto";

export const GMAIL_SESSION_COOKIE = "jarvis_gmail";
export const GMAIL_STATE_COOKIE = "jarvis_gmail_state";

export type GmailSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  email: string;
  connectedAt: string;
};

export function sealGmailSession(session: GmailSession) {
  return encryptCredential(JSON.stringify(session));
}

export function unsealGmailSession(value?: string | null): GmailSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decryptCredential(value)) as Partial<GmailSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt || !parsed.email || !parsed.connectedAt || !Array.isArray(parsed.scopes)) return null;
    return parsed as GmailSession;
  } catch {
    return null;
  }
}

export function gmailCookieOptions(maxAge = 60 * 60 * 24 * 180) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge,
  };
}
