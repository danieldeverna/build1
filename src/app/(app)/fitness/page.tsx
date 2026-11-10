import { FitnessWorkspace } from "@/components/fitness/fitness-workspace";
import { PageHeader } from "@/components/page-header";
import { cookies } from "next/headers";
import { GOOGLE_CALENDAR_SESSION_COOKIE, unsealGoogleCalendarSession } from "@/integrations/google-calendar/session";
import { getMockFitnessPlan } from "@/lib/mock-data";

export const metadata = { title: "Fitness" };

export default async function Page() {
  const cookieStore = await cookies();
  const connected = Boolean(unsealGoogleCalendarSession(cookieStore.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value));
  return <><PageHeader eyebrow="Personal training" title="Fitness planner" description="Three protected lifts, intelligently fitted around your week."/><FitnessWorkspace initialPlan={getMockFitnessPlan()} googleCalendarConnected={connected}/></>;
}
