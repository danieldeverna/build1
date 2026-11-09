import { cookies } from "next/headers";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { PageHeader } from "@/components/page-header";
import { GOOGLE_CALENDAR_SESSION_COOKIE, unsealGoogleCalendarSession } from "@/integrations/google-calendar/session";
import { getMockEvents } from "@/lib/mock-data";

export const metadata = { title: "Calendar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const connected = Boolean(unsealGoogleCalendarSession(cookieStore.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value));
  return <>
    <PageHeader eyebrow="Schedule" title="Calendar" description={connected ? "Your Google Calendar is synced here; new Jarvis events can publish to it." : "Connect Google Calendar to replace preview events with your live schedule."} />
    <CalendarWorkspace initialEvents={connected ? [] : getMockEvents()} initialNew={params.new === "true"} googleCalendarConnected={connected} />
  </>;
}
