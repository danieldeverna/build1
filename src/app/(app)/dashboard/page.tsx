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
import { Suspense } from "react";
import { DashboardAgendaCard, DashboardCalendarStatus } from "@/components/dashboard/dashboard-calendar";
import { TimeAwareGreeting } from "@/components/dashboard/time-aware-greeting";
import { MorningBriefTileSkeleton } from "@/components/morning-brief/morning-brief-skeleton";
import { MorningBriefTile } from "@/components/morning-brief/morning-brief-tile";
import { PageHeader } from "@/components/page-header";
import { incompleteTaskCounts } from "@/domain/tasks";
import { loadTaskSnapshot, loadWeatherSnapshot } from "@/data/morning-brief";
import type { SourceSnapshot } from "@/domain/morning-brief";
import type { Task } from "@/domain/tasks";
import type { WeatherForecast } from "@/domain/weather";
import { weatherCodeInfo } from "@/domain/weather";

export const metadata = { title: "Today" };

export default async function DashboardPage() {
  const renderedAt = new Date().toISOString();
  const taskPromise = loadTaskSnapshot();
  const weatherPromise = loadWeatherSnapshot();

  return (
    <>
      <PageHeader
        eyebrow="Daily command center"
        title={<TimeAwareGreeting name="Daniel" />}
        description="Here’s the shape of your day. Keep the signal high and the noise low."
        actions={
          <Link href="/calendar?new=true" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-[var(--accent)]">
            <Plus size={16} /> New event
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(22rem,1.1fr)_minmax(15rem,0.95fr)_minmax(15rem,0.95fr)]">
        <DashboardAgendaCard />

        <Link href="/calendar" className="card card-interactive focus-ring group min-h-56 overflow-hidden p-4 xl:h-[21.5rem] xl:min-h-0">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><CalendarDays size={19} /></span>
              <ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={18} />
            </div>
            <p className="mt-4 text-lg font-bold tracking-[-0.035em]">Calendar</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Your week at a glance</p>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className="text-center">
                  <p className="text-[0.6rem] font-bold text-[var(--muted-2)]">{day}</p>
                  <span className={`mx-auto mt-2 grid size-7 place-items-center rounded-full text-xs font-semibold ${index === new Date().getDay() ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}>{new Date().getDate() - new Date().getDay() + index}</span>
                  <span className={`mx-auto mt-2 block size-1 rounded-full ${[1, 3, 4].includes(index) ? "bg-violet-400" : "bg-transparent"}`} />
                </div>
              ))}
            </div>
        </Link>

        <Suspense fallback={<LargeTileSkeleton label="Loading work"/>}><WorkTile taskPromise={taskPromise}/></Suspense>
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<SmallTileSkeleton label="Loading weather"/>}><WeatherTile weatherPromise={weatherPromise}/></Suspense>
        <DashboardTile href="/health" icon={<HeartPulse size={19} />} iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300" title="Health" eyebrow="Daily check-in">
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">No summary yet. Add a manual check-in when you’re ready.</p>
        </DashboardTile>
        <DashboardTile href="/fitness" icon={<Dumbbell size={19} />} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" title="Fitness" eyebrow="Movement">
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">Today is open. Plan a workout or recovery session.</p>
        </DashboardTile>
        <Suspense fallback={<MorningBriefTileSkeleton/>}><MorningBriefTileData renderedAt={renderedAt} taskPromise={taskPromise} weatherPromise={weatherPromise}/></Suspense>
      </section>

      <DashboardCalendarStatus />
    </>
  );
}

async function WorkTile({ taskPromise }: { taskPromise: Promise<SourceSnapshot<Task[]>> }) {
  const snapshot = await taskPromise;
  if (snapshot.status === "error") return <Link href="/work" className="card card-interactive focus-ring group min-h-56 overflow-hidden p-4 xl:h-[21.5rem] xl:min-h-0"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><SquareCheckBig size={19}/></span><ArrowUpRight size={18}/></div><p className="mt-5 text-lg font-bold">Work unavailable</p><p className="mt-2 text-sm text-[var(--muted)]">Open Work to retry without hiding the rest of your dashboard.</p></Link>;
  const counts = incompleteTaskCounts(snapshot.data);
  return <Link href="/work" className="card card-interactive focus-ring group min-h-56 overflow-hidden p-4 xl:h-[21.5rem] xl:min-h-0"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><SquareCheckBig size={19}/></span><ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={18}/></div><div className="mt-4 flex items-baseline gap-2"><p className="text-3xl font-bold tracking-[-0.055em]">{counts.all}</p><p className="text-sm text-[var(--muted)]">open tasks</p></div><div className="mt-4 space-y-3"><div className="flex items-center gap-3 text-sm"><BookOpenCheck size={15} className="text-violet-500"/><span className="flex-1 truncate">Academic</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.academic}</span></div><div className="flex items-center gap-3 text-sm"><Sunrise size={15} className="text-amber-500"/><span className="flex-1 truncate">Recruiting</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.recruiting}</span></div><div className="flex items-center gap-3 text-sm"><SquareCheckBig size={15} className="text-blue-500"/><span className="flex-1 truncate">Projects</span><span className="text-xs font-semibold text-[var(--muted)]">{counts.projects}</span></div></div></Link>;
}

async function WeatherTile({ weatherPromise }: { weatherPromise: Promise<SourceSnapshot<WeatherForecast>> }) {
  const snapshot = await weatherPromise;
  const forecast = snapshot.status === "error" ? null : snapshot.data;
  return <DashboardTile href="/weather" icon={<CloudSun size={19}/>} iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300" title="Georgetown, D.C." eyebrow={snapshot.status === "stale" ? "Weather · may be stale" : "Weather"}>{forecast ? <div className="mt-5 flex items-end justify-between"><p className="text-4xl font-semibold tracking-[-0.06em]">{Math.round(forecast.current.temperature)}°</p><div className="text-right text-xs leading-5 text-[var(--muted)]"><p>H {Math.round(forecast.daily[0]?.high ?? forecast.current.temperature)}° · L {Math.round(forecast.daily[0]?.low ?? forecast.current.temperature)}°</p><p>{weatherCodeInfo(forecast.current.weatherCode).label}</p></div></div> : <p className="mt-5 text-sm leading-6 text-[var(--muted)]">Live conditions unavailable</p>}</DashboardTile>;
}

async function MorningBriefTileData({ renderedAt, taskPromise, weatherPromise }: { renderedAt: string; taskPromise: Promise<SourceSnapshot<Task[]>>; weatherPromise: Promise<SourceSnapshot<WeatherForecast>> }) {
  const [tasks, weather] = await Promise.all([taskPromise, weatherPromise]);
  return <MorningBriefTile renderedAt={renderedAt} tasks={tasks} weather={weather}/>;
}

function LargeTileSkeleton({ label }: { label: string }) { return <div className="card min-h-56 animate-pulse p-4 xl:h-[21.5rem]" aria-label={label}><div className="size-10 rounded-xl bg-[var(--surface-subtle)]"/><div className="mt-5 h-8 w-20 rounded bg-[var(--surface-subtle)]"/></div>; }
function SmallTileSkeleton({ label }: { label: string }) { return <div className="card min-h-40 animate-pulse p-4 xl:min-h-36" aria-label={label}><div className="size-10 rounded-xl bg-[var(--surface-subtle)]"/><div className="mt-5 h-8 w-20 rounded bg-[var(--surface-subtle)]"/></div>; }

function DashboardTile({ href, icon, iconClass, eyebrow, title, children }: { href: string; icon: React.ReactNode; iconClass: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="card card-interactive focus-ring group min-h-40 p-4 xl:min-h-36">
      <div className="flex items-start justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${iconClass}`}>{icon}</span>
        <ArrowUpRight className="text-[var(--muted-2)] transition group-hover:text-[var(--accent)]" size={17} />
      </div>
      <p className="eyebrow mt-4">{eyebrow}</p>
      <h2 className="mt-1 font-bold tracking-[-0.03em]">{title}</h2>
      {children}
    </Link>
  );
}
