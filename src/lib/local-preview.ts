export function isLocalPreviewConfigured() {
  if (process.env.DEV_AUTH_BYPASS !== "true") return false;

  try {
    const hostname = new URL(process.env.APP_URL ?? "").hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
