import "server-only";

const API_ROOT = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailApiMessage = { id?: string; threadId?: string; labelIds?: string[]; snippet?: string; internalDate?: string; payload?: { headers?: GmailHeader[]; mimeType?: string; body?: { data?: string }; parts?: GmailPart[] } };
type GmailListResponse = { messages?: Array<{ id?: string }>; error?: { message?: string } };

export type GmailMessageSummary = { id: string; threadId: string; from: string; to: string; subject: string; receivedAt: string | null; labels: string[]; snippet: string };
export type GmailMessage = GmailMessageSummary & { body: string };

function header(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function summary(message: GmailApiMessage): GmailMessageSummary | null {
  if (!message.id || !message.threadId) return null;
  const time = Number(message.internalDate);
  return { id: message.id, threadId: message.threadId, from: header(message.payload?.headers, "From"), to: header(message.payload?.headers, "To"), subject: header(message.payload?.headers, "Subject") || "(No subject)", receivedAt: Number.isFinite(time) ? new Date(time).toISOString() : null, labels: message.labelIds ?? [], snippet: message.snippet ?? "" };
}

function decode(data?: string) {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function bodyFromPart(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain") return decode(part.body?.data);
  return part.parts?.map(bodyFromPart).find(Boolean) ?? "";
}

export class GmailApiAdapter {
  constructor(private readonly accessToken: string) {}

  private async request<T>(url: URL) {
    const response = await fetch(url, { headers: { authorization: `Bearer ${this.accessToken}`, accept: "application/json" }, cache: "no-store" });
    const result = await response.json() as T & { error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message || `Gmail request failed (${response.status})`);
    return result;
  }

  async listRecentMessages(limit = 12) {
    const url = new URL(`${API_ROOT}/messages`);
    url.searchParams.set("maxResults", String(Math.min(Math.max(limit, 1), 25)));
    const result = await this.request<GmailListResponse>(url);
    const messages = await Promise.all((result.messages ?? []).filter((item) => item.id).map(async (item) => {
      const detailUrl = new URL(`${API_ROOT}/messages/${item.id}`);
      detailUrl.searchParams.set("format", "metadata");
      detailUrl.searchParams.append("metadataHeaders", "From");
      detailUrl.searchParams.append("metadataHeaders", "To");
      detailUrl.searchParams.append("metadataHeaders", "Subject");
      return summary(await this.request<GmailApiMessage>(detailUrl));
    }));
    return messages.filter((message): message is GmailMessageSummary => Boolean(message));
  }

  async readMessage(messageId: string): Promise<GmailMessage> {
    const result = await this.request<GmailApiMessage>(new URL(`${API_ROOT}/messages/${encodeURIComponent(messageId)}`));
    const base = summary(result);
    if (!base) throw new Error("Gmail returned an invalid message");
    return { ...base, body: bodyFromPart(result.payload) };
  }
}
