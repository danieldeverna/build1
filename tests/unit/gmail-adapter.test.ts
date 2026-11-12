import { afterEach, describe, expect, it, vi } from "vitest";
import { GmailApiAdapter } from "@/integrations/gmail/adapter";

describe("Gmail API adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists message summaries using read-only GET requests", async () => {
    const fetchMock = vi.fn(async (input: URL, init?: RequestInit) => {
      void init;
      if (input.pathname.endsWith("/messages")) return new Response(JSON.stringify({ messages: [{ id: "one" }, { id: "two" }] }), { status: 200 });
      const id = input.pathname.split("/").at(-1);
      return new Response(JSON.stringify({ id, threadId: `thread-${id}`, labelIds: ["INBOX"], snippet: `Preview ${id}`, internalDate: "1794240000000", payload: { headers: [{ name: "From", value: "Professor <prof@example.edu>" }, { name: "Subject", value: `Message ${id}` }] } }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const messages = await new GmailApiAdapter("access-token").listRecentMessages(2);

    expect(messages.map((message) => message.subject)).toEqual(["Message one", "Message two"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.method).toBeUndefined();
      expect(init?.headers).toMatchObject({ authorization: "Bearer access-token" });
    }
  });

  it("reads a selected plain-text message without modifying it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "one", threadId: "thread-one", snippet: "Hello", internalDate: "1794240000000", payload: { headers: [{ name: "Subject", value: "Hello" }], parts: [{ mimeType: "text/plain", body: { data: "SGVsbG8gd29ybGQ" } }] } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const message = await new GmailApiAdapter("access-token").readMessage("one");

    expect(message.body).toBe("Hello world");
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });
});
