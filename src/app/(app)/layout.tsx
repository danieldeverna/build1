import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentViewer } from "@/lib/auth";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const viewer=await getCurrentViewer();if(!viewer)redirect("/sign-in");return <AppShell viewerName={viewer.name?.split(" ")[0]??"You"}>{children}</AppShell>}
