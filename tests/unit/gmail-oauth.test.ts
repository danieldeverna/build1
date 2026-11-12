import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGmailAuthorizationUrl, exchangeGmailAuthorizationCode, GMAIL_READONLY_SCOPES, getGmailSetup, refreshGmailAccessToken } from "@/integrations/gmail/oauth";

const originalEnvironment = { ...process.env };

describe("Gmail OAuth", () => {
  afterEach(() => {
    process.env = { ...originalEnvironment };
    vi.unstubAllGlobals();
  });

  it("requests only identity and Gmail read-only access", () => {
    const url = buildGmailAuthorizationUrl({ clientId: "client-id", clientSecret: "client-secret", redirectUri: "http://localhost:3000/api/integrations/gmail/callback" }, "state-token");
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")?.split(" ")).toEqual(GMAIL_READONLY_SCOPES);
    expect(url.searchParams.get("scope")).not.toContain("gmail.modify");
    expect(url.searchParams.get("scope")).not.toContain("gmail.send");
  });

  it("validates setup before showing a connection control", () => {
    process.env.APP_URL = "not-a-url";
    process.env.GMAIL_CLIENT_ID = "client-id";
    process.env.GMAIL_CLIENT_SECRET = "client-secret";
    process.env.CREDENTIAL_ENCRYPTION_KEY = "too-short";
    expect(getGmailSetup()).toEqual({ configured: false, missing: ["APP_URL", "CREDENTIAL_ENCRYPTION_KEY"] });
  });

  it("exchanges and refreshes read-only credentials", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "first-access", refresh_token: "refresh-token", expires_in: 3600, scope: GMAIL_READONLY_SCOPES.join(" ") }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "refreshed-access", expires_in: 3600, scope: GMAIL_READONLY_SCOPES.join(" ") }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const config = { clientId: "client-id", clientSecret: "client-secret", redirectUri: "http://localhost:3000/api/integrations/gmail/callback" };
    const initial = await exchangeGmailAuthorizationCode(config, "authorization-code");
    const refreshed = await refreshGmailAccessToken(config, initial.refreshToken);
    expect(initial).toMatchObject({ accessToken: "first-access", refreshToken: "refresh-token" });
    expect(refreshed).toMatchObject({ accessToken: "refreshed-access" });
  });
});
