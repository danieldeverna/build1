"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";

type GmailMessageSummary = { id: string; from: string; subject: string; receivedAt: string | null; snippet: string };

export function GmailPreview() {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/integrations/gmail/messages?limit=6", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { messages?: GmailMessageSummary[] };
        if (!response.ok || !result.messages) throw new Error("Gmail could not be synchronized");
        setMessages(result.messages);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState("error");
      });
    return () => controller.abort();
  }, []);

  if (state === "loading") return <p className="mt-4 text-xs text-[var(--muted)]">Syncing your latest mail…</p>;
  if (state === "error") return <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">Gmail could not sync. Reconnect to refresh the read-only connection.</p>;
  if (!messages.length) return <p className="mt-4 text-xs text-[var(--muted)]">No recent messages were returned by Gmail.</p>;
  return <div className="mt-4 divide-y rounded-xl border">
    {messages.map((message) => <article key={message.id} className="px-3 py-2.5"><div className="flex items-baseline justify-between gap-3"><p className="min-w-0 truncate text-xs font-semibold">{message.subject}</p>{message.receivedAt && <time className="shrink-0 text-[.65rem] text-[var(--muted)]">{formatDistanceToNowStrict(new Date(message.receivedAt), { addSuffix: true })}</time>}</div><p className="mt-1 truncate text-[.68rem] text-[var(--muted)]">{message.from || "Unknown sender"}</p></article>)}
  </div>;
}
