import { afterEach, describe, expect, it } from "vitest";
import { isLocalPreviewConfigured } from "@/lib/local-preview";

const originalAppUrl = process.env.APP_URL;
const originalBypass = process.env.DEV_AUTH_BYPASS;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;

  if (originalBypass === undefined) delete process.env.DEV_AUTH_BYPASS;
  else process.env.DEV_AUTH_BYPASS = originalBypass;
});

describe("local preview authentication", () => {
  it.each(["http://localhost:3000", "http://127.0.0.1:3000"])(
    "allows an explicit bypass for %s",
    (appUrl) => {
      process.env.APP_URL = appUrl;
      process.env.DEV_AUTH_BYPASS = "true";

      expect(isLocalPreviewConfigured()).toBe(true);
    },
  );

  it("rejects the bypass for a deployed host", () => {
    process.env.APP_URL = "https://jarvis.example.com";
    process.env.DEV_AUTH_BYPASS = "true";

    expect(isLocalPreviewConfigured()).toBe(false);
  });

  it("rejects missing and malformed configuration", () => {
    process.env.APP_URL = "not-a-url";
    process.env.DEV_AUTH_BYPASS = "true";
    expect(isLocalPreviewConfigured()).toBe(false);

    process.env.APP_URL = "http://localhost:3000";
    process.env.DEV_AUTH_BYPASS = "false";
    expect(isLocalPreviewConfigured()).toBe(false);
  });
});
