import "server-only";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_REVOCATION_URL = "https://oauth2.googleapis.com/revoke";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.readonly",
] as const;

export type GoogleCalendarOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleCalendarTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export function getGoogleCalendarSetup() {
  const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  let encryptionKeyIsValid = false;
  try {
    encryptionKeyIsValid = Boolean(encryptionKey && Buffer.from(encryptionKey, "base64").length === 32);
  } catch {
    encryptionKeyIsValid = false;
  }
  let appUrlIsValid = false;
  try {
    appUrlIsValid = Boolean(process.env.APP_URL && new URL(process.env.APP_URL).origin);
  } catch {
    appUrlIsValid = false;
  }
  const required = {
    APP_URL: appUrlIsValid ? process.env.APP_URL : undefined,
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    CREDENTIAL_ENCRYPTION_KEY: encryptionKeyIsValid ? encryptionKey : undefined,
  };
  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
  return { configured: missing.length === 0, missing };
}

export function getGoogleCalendarOAuthConfig(): GoogleCalendarOAuthConfig {
  const setup = getGoogleCalendarSetup();
  if (!setup.configured) throw new Error(`Google Calendar is missing configuration: ${setup.missing.join(", ")}`);
  const appUrl = new URL(process.env.APP_URL!);
  return {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri: new URL("/api/integrations/google-calendar/callback", appUrl).toString(),
  };
}

export function buildGoogleAuthorizationUrl(config: GoogleCalendarOAuthConfig, state: string) {
  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url;
}

async function requestTokens(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await response.json() as GoogleTokenResponse;
  if (!response.ok || result.error || !result.access_token) {
    throw new Error(result.error_description || result.error || "Google did not return an access token");
  }
  return result;
}

export async function exchangeGoogleAuthorizationCode(config: GoogleCalendarOAuthConfig, code: string): Promise<GoogleCalendarTokenSet> {
  const result = await requestTokens(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  }));
  if (!result.refresh_token) throw new Error("Google did not return a refresh token. Revoke Jarvis access in Google, then reconnect.");
  return {
    accessToken: result.access_token!,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + Math.max(60, result.expires_in ?? 3600) * 1000,
    scopes: result.scope?.split(" ").filter(Boolean) ?? [...GOOGLE_CALENDAR_SCOPES],
  };
}

export async function refreshGoogleAccessToken(config: GoogleCalendarOAuthConfig, refreshToken: string): Promise<Omit<GoogleCalendarTokenSet, "refreshToken">> {
  const result = await requestTokens(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }));
  return {
    accessToken: result.access_token!,
    expiresAt: Date.now() + Math.max(60, result.expires_in ?? 3600) * 1000,
    scopes: result.scope?.split(" ").filter(Boolean) ?? [...GOOGLE_CALENDAR_SCOPES],
  };
}

export async function getGoogleAccountEmail(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const result = await response.json() as { email?: string; email_verified?: boolean };
  if (!response.ok || !result.email || result.email_verified === false) throw new Error("Google account email could not be verified");
  return result.email.toLowerCase();
}

export async function revokeGoogleToken(token: string) {
  const response = await fetch(GOOGLE_REVOCATION_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google token revocation failed");
}
