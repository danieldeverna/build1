import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Calendar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  return <>
    <PageHeader eyebrow="Schedule" title="Calendar" description="Your schedule combines connected events with private Jarvis changes and workouts." />
    <CalendarWorkspace initialNew={params.new === "true"} />
  </>;
}
