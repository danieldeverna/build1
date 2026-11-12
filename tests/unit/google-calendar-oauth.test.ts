import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoogleAuthorizationUrl, exchangeGoogleAuthorizationCode, getGoogleCalendarSetup, GOOGLE_CALENDAR_SCOPES, refreshGoogleAccessToken } from "@/integrations/google-calendar/oauth";

const originalEnvironment = { ...process.env };

describe("Google Calendar OAuth", () => {
  afterEach(() => {
    process.env = { ...originalEnvironment };
    vi.unstubAllGlobals();
  });

  it("builds an offline, incremental-consent authorization request", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google-calendar/callback",
    }, "state-token");

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/integrations/google-calendar/callback");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("include_granted_scopes")).toBe("true");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("state-token");
    expect(url.searchParams.get("scope")?.split(" ")).toEqual(GOOGLE_CALENDAR_SCOPES);
  });

  it("rejects malformed application URLs and encryption keys before consent", () => {
    process.env.APP_URL = "not-a-url";
    process.env.GOOGLE_CALENDAR_CLIENT_ID = "client-id";
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "client-secret";
    process.env.CREDENTIAL_ENCRYPTION_KEY = "too-short";

    expect(getGoogleCalendarSetup()).toEqual({
      configured: false,
      missing: ["APP_URL", "CREDENTIAL_ENCRYPTION_KEY"],
    });
  });

  it("exchanges authorization codes and refreshes expiring access", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "first-access", refresh_token: "refresh-token", expires_in: 3600, scope: GOOGLE_CALENDAR_SCOPES.join(" ") }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "refreshed-access", expires_in: 3600, scope: GOOGLE_CALENDAR_SCOPES.join(" ") }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const config = { clientId: "client-id", clientSecret: "client-secret", redirectUri: "http://localhost:3000/api/integrations/google-calendar/callback" };

    const initial = await exchangeGoogleAuthorizationCode(config, "authorization-code");
    const refreshed = await refreshGoogleAccessToken(config, initial.refreshToken);

    expect(initial).toMatchObject({ accessToken: "first-access", refreshToken: "refresh-token" });
    expect(refreshed).toMatchObject({ accessToken: "refreshed-access" });
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("grant_type=authorization_code");
    expect(String(fetchMock.mock.calls[1][1]?.body)).toContain("grant_type=refresh_token");
  });
});
