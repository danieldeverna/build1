import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  CloudSun,
  Dumbbell,
  HeartPulse,
  Plus,
  SquareCheckBig,
  Sunrise,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DayAgenda } from "@/components/dashboard/day-agenda";
import { PageHeader } from "@/components/page-header";
import { incompleteTaskCounts } from "@/domain/tasks";
import { getMockEvents, mockTasks } from "@/lib/mock-data";

export const metadata = { title: "Today" };

export default function DashboardPage() {
  const events = getMockEvents();
  const counts = incompleteTaskCounts(mockTasks);

  return (
    <>
      <PageHeader
        eyebrow="Daily command center"
        title="Good morning, Daniel."
        description="Here’s the shape of your day. Keep the signal high and the noise low."
        actions={
          <Link href="/calendar?new=true" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-[var(--accent)]">
            <Plus size={16} /> New event
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.7fr)]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-bold">Daily agenda</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{format(new Date(), "EEEE, MMMM d")}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
              <span className="size-2 rounded-full bg-emerald-500" />
              3 events today
            </div>
          </div>
          <div className="px-3 pt-4 sm:px-5">
            <DayAgenda events={events} />
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <Link href="/calendar" className="card card-interactive focus-ring group min-h-64 overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><CalendarDays size={19} /></span>
              <ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={18} />
            </div>
            <p className="mt-5 text-lg font-bold tracking-[-0.035em]">Calendar</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Your week at a glance</p>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className="text-center">
                  <p className="text-[0.6rem] font-bold text-[var(--muted-2)]">{day}</p>
                  <span className={`mx-auto mt-2 grid size-7 place-items-center rounded-full text-xs font-semibold ${index === new Date().getDay() ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}>{new Date().getDate() - new Date().getDay() + index}</span>
                  <span className={`mx-auto mt-2 block size-1 rounded-full ${[1, 3, 4].includes(index) ? "bg-violet-400" : "bg-transparent"}`} />
                </div>
              ))}
            </div>
          </Link>

          <Link href="/work" className="card card-interactive focus-ring group min-h-64 overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><SquareCheckBig size={19} /></span>
              <ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={18} />
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-[-0.055em]">{counts.all}</p>
              <p className="text-sm text-[var(--muted)]">open tasks</p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 text-sm"><BookOpenCheck size={15} className="text-violet-500" /><span className="flex-1 truncate">Academic</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.academic}</span></div>
              <div className="flex items-center gap-3 text-sm"><Sunrise size={15} className="text-amber-500" /><span className="flex-1 truncate">Recruiting</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.recruiting}</span></div>
              <div className="flex items-center gap-3 text-sm"><SquareCheckBig size={15} className="text-blue-500" /><span className="flex-1 truncate">Projects</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.projects}</span></div>
            </div>
          </Link>
        </div>
      </div>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardTile href="/weather" icon={<CloudSun size={19} />} iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300" title="Washington, D.C." eyebrow="Weather">
          <div className="mt-5 flex items-end justify-between"><p className="text-4xl font-semibold tracking-[-0.06em]">63°</p><div className="text-right text-xs leading-5 text-[var(--muted)]"><p>H 68° · L 51°</p><p>Partly cloudy</p></div></div>
        </DashboardTile>
        <DashboardTile href="/health" icon={<HeartPulse size={19} />} iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300" title="Health" eyebrow="Daily check-in">
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">No summary yet. Add a manual check-in when you’re ready.</p>
        </DashboardTile>
        <DashboardTile href="/fitness" icon={<Dumbbell size={19} />} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" title="Fitness" eyebrow="Movement">
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">Today is open. Plan a workout or recovery session.</p>
        </DashboardTile>
        <div className="rounded-[1.25rem] border border-dashed p-5 text-[var(--muted)]">
          <div className="flex items-center gap-2 text-xs font-semibold"><Plus size={14} /> Extension slot</div>
          <p className="mt-12 text-sm leading-6">A future space for travel or another module.</p>
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between rounded-xl border bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-400" /> Preview data is active. Google Calendar and Canvas are not connected.</span>
        <Link href="/settings" className="hidden font-semibold text-[var(--accent)] sm:block">Review connections</Link>
      </div>
    </>
  );
}

function DashboardTile({ href, icon, iconClass, eyebrow, title, children }: { href: string; icon: React.ReactNode; iconClass: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="card card-interactive focus-ring group min-h-52 p-5">
      <div className="flex items-start justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${iconClass}`}>{icon}</span>
        <ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={17} />
      </div>
      <p className="eyebrow mt-5">{eyebrow}</p>
      <h2 className="mt-1 font-bold tracking-[-0.03em]">{title}</h2>
      {children}
    </Link>
  );
}
