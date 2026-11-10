import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { cookies } from "next/headers";
import { GOOGLE_CALENDAR_SESSION_COOKIE, unsealGoogleCalendarSession } from "@/integrations/google-calendar/session";
import { getCurrentViewer } from "@/lib/auth";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const viewer=await getCurrentViewer();if(!viewer)redirect("/sign-in");const cookieStore=await cookies();const googleCalendarConnected=Boolean(unsealGoogleCalendarSession(cookieStore.get(GOOGLE_CALENDAR_SESSION_COOKIE)?.value));return <AppShell viewerName={viewer.name?.split(" ")[0]??"You"} googleCalendarConnected={googleCalendarConnected}>{children}</AppShell>}
