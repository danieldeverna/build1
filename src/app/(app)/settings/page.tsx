import { cookies } from "next/headers";
import { CalendarCheck2, Clock3, CloudSun, Link2, Mail, ShieldCheck, Unplug } from "lucide-react";
import { GmailPreview } from "@/components/gmail/gmail-preview";
import { PageHeader } from "@/components/page-header";
import { getGmailSetup } from "@/integrations/gmail/oauth";
import { GMAIL_SESSION_COOKIE, unsealGmailSession } from "@/integrations/gmail/session";
import { getGoogleCalendarSetup } from "@/integrations/google-calendar/oauth";
import { GOOGLE_CALENDAR_SESSION_COOKIE, unsealGoogleCalendarSession } from "@/integrations/google-calendar/session";

export const metadata = { title: "Settings" };

const calendarMessages: Record<string, { tone: string; text: string }> = {
  connected: { tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100", text: "Google Calendar is connected and ready to sync." },
  disconnected: { tone: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100", text: "Google Calendar was disconnected from this browser." },
  cancelled: { tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100", text: "Google authorization was cancelled. Nothing changed." },
  invalid_state: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "The connection request expired or failed its security check. Please try again." },
  wrong_account: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "That Google account is not authorized for this Jarvis workspace." },
  oauth_error: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "Google could not complete the connection. Try reconnecting." },
  setup_error: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "Google Calendar environment settings are incomplete." },
};

const gmailMessages: Record<string, { tone: string; text: string }> = {
  connected: { tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100", text: "Gmail is connected with read-only access." },
  disconnected: { tone: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100", text: "Gmail was disconnected and its local credentials were removed." },
  cancelled: { tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100", text: "Gmail authorization was cancelled. Nothing changed." },
  invalid_state: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "The Gmail connection request expired or failed its security check. Please try again." },
  wrong_account: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "That Google account is not authorized for this Jarvis workspace." },
  oauth_error: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "Gmail could not complete the connection. Try reconnecting." },
  setup_error: { tone: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100", text: "Gmail environment settings are incomplete." },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ calendar?: string; gmail?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const connection = unsealGoogleCalendarSession(cookieStore.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value);
  const gmailConnection = unsealGmailSession(cookieStore.get(GMAIL_SESSION_COOKIE)?.value);
  const setup = getGoogleCalendarSetup();
  const gmailSetup = getGmailSetup();
  const message = params.calendar ? calendarMessages[params.calendar] : undefined;
  const gmailMessage = params.gmail ? gmailMessages[params.gmail] : undefined;

  return <>
    <PageHeader eyebrow="Workspace" title="Settings" description="Manage preferences, connections, and trust surfaces." />
    {message && <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.tone}`}>{message.text}</div>}
    {gmailMessage && <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${gmailMessage.tone}`}>{gmailMessage.text}</div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-bold">Connections</h2><p className="mt-1 text-sm text-[var(--muted)]">Bring your schedule into Jarvis.</p></div>
          <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${connection ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>{connection ? "Connected" : "Not connected"}</span>
        </div>
        <div className="mt-5 border-t pt-5">
          <div className="flex items-start gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${connection ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" : "bg-[var(--surface-subtle)] text-[var(--muted)]"}`}><CalendarCheck2 size={18} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">Google Calendar</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{connection ? connection.email : "Read your schedule into Jarvis's private platform calendar."}</p></div>
          </div>
          {!setup.configured && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">Complete these values in <code>.env.local</code>: {setup.missing.join(", ")}.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <a aria-disabled={!setup.configured} href={setup.configured ? "/api/integrations/google-calendar/connect" : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${setup.configured ? "bg-[var(--navy)] text-white dark:bg-[var(--accent)]" : "cursor-not-allowed bg-[var(--surface-subtle)] text-[var(--muted-2)]"}`}><Link2 size={15} />{connection ? "Reconnect" : "Connect Google Calendar"}</a>
            {connection && <form action="/api/integrations/google-calendar/disconnect" method="post"><button className="focus-ring inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-subtle)]"><Unplug size={15} />Disconnect</button></form>}
          </div>
        </div>
        <div className="mt-5 border-t pt-5">
          <div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${gmailConnection ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" : "bg-[var(--surface-subtle)] text-[var(--muted)]"}`}><Mail size={18} /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">Gmail</p><p className="mt-1 text-xs text-[var(--muted)]">{gmailConnection ? `${gmailConnection.email} · read-only` : "Read email privately for future briefings and workspace context."}</p></div></div>
          {!gmailSetup.configured && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">Complete these values in <code>.env.local</code>: {gmailSetup.missing.join(", ")}. Gmail API must also be enabled in Google Cloud.</p>}
          <div className="mt-5 flex flex-wrap gap-2"><a aria-disabled={!gmailSetup.configured} href={gmailSetup.configured ? "/api/integrations/gmail/connect" : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${gmailSetup.configured ? "bg-[var(--navy)] text-white dark:bg-[var(--accent)]" : "cursor-not-allowed bg-[var(--surface-subtle)] text-[var(--muted-2)]"}`}><Link2 size={15} />{gmailConnection ? "Reconnect Gmail" : "Connect Gmail"}</a>{gmailConnection && <form action="/api/integrations/gmail/disconnect" method="post"><button className="focus-ring inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-subtle)]"><Unplug size={15} />Disconnect</button></form>}</div>
          {gmailConnection && <GmailPreview />}
        </div>
        <div className="mt-5 border-t pt-4"><div className="flex items-center gap-3"><Link2 size={16} className="text-[var(--muted)]" /><span className="flex-1 text-sm font-medium">Canvas</span><span className="text-xs text-[var(--muted)]">Setup pending</span></div></div>
      </section>
      <section className="card p-6"><h2 className="font-bold">Preferences</h2><Row icon={Clock3} label="Time zone" value="America/New_York" /><Row icon={CloudSun} label="Weather" value="Georgetown, D.C." /></section>
      <section className="card p-6 lg:col-span-2"><ShieldCheck className="text-emerald-500" /><h2 className="mt-4 font-bold">Private workspace</h2><p className="mt-2 text-sm text-[var(--muted)]">Google credentials are encrypted, stored in an HttpOnly cookie, and never exposed to browser JavaScript. Google Calendar and Gmail are read-only sources: no Jarvis route can send, delete, archive, or otherwise modify email.</p></section>
    </div>
  </>;
}

function Row({ icon: Icon, label, value }: { icon: typeof Link2; label: string; value: string }) {
  return <div className="mt-5 flex items-center gap-3 border-t pt-4"><Icon size={16} className="text-[var(--muted)]" /><span className="flex-1 text-sm font-medium">{label}</span><span className="text-xs text-[var(--muted)]">{value}</span></div>;
}
