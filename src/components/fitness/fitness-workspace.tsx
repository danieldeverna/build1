"use client";

import { CalendarCheck2, Check, Clock3, Database, Dumbbell, ShieldCheck, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import { useCalendarData } from "@/components/calendar/calendar-data-provider";
import { plannedWorkoutToCalendarEvent, workoutTemplates, type PlannedWorkout } from "@/domain/fitness";
import { cn } from "@/lib/cn";

export function FitnessWorkspace({ initialPlan }: { initialPlan: PlannedWorkout[] }) {
  const { events: calendarEvents, fitnessPlan } = useCalendarData();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Pick<PlannedWorkout, "status" | "reason">>>({});
  const [skipId, setSkipId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const plan = useMemo(() => (fitnessPlan ?? initialPlan).map((workout) => ({ ...workout, ...statusOverrides[workout.id] })), [fitnessPlan, initialPlan, statusOverrides]);
  const previewEvents = calendarEvents.length > 0 ? calendarEvents : initialPlan.map(plannedWorkoutToCalendarEvent);
  const nextWorkout = useMemo(() => plan.find((item) => item.status === "scheduled" && item.protected) ?? plan.find((item) => item.status === "scheduled"), [plan]);
  const completed = plan.filter((item) => item.status === "completed").length;

  function updateStatus(id: string, status: PlannedWorkout["status"], reason?: string) {
    const current = plan.find((item) => item.id === id);
    if (current) setStatusOverrides((overrides) => ({ ...overrides, [id]: { status, reason: reason ?? current.reason } }));
    setSkipId(null);
  }

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[1.25rem] border border-emerald-900 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 p-6 text-white shadow-[var(--shadow)] sm:p-7">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl"><p className="text-[.68rem] font-bold uppercase tracking-[.16em] text-emerald-300">Operation summer ready</p><h2 className="mt-3 text-3xl font-bold tracking-[-.04em]">Your week, trained around your life.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Three protected lifts build consistency. A fourth appears only when the week has room.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center"><Metric value="3" label="Protected"/><Metric value="60–75" label="Minutes"/><Metric value={`${completed}/${plan.length}`} label="Complete"/></div>
      </div>
    </section>

    <section>
      <div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">This week</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">Scheduled automatically</h2></div><button onClick={() => setPreviewOpen(true)} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)]"><CalendarCheck2 size={14}/>Preview calendar</button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{plan.map((workout, index)=><WorkoutCard key={workout.id} workout={workout} index={index}/>)}</div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Up next</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">{nextWorkout?.title ?? "Week complete"}</h2><p className="mt-1 text-sm text-[var(--muted)]">{nextWorkout ? `${format(new Date(nextWorkout.liftStart), "EEEE · h:mm a")} · ${nextWorkout.durationMinutes} min` : "All planned sessions are handled."}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"><Dumbbell size={20}/></span></div>
        {nextWorkout&&<><div className="mt-5 grid gap-2 sm:grid-cols-2">{nextWorkout.exercises.map((exercise)=><div key={exercise.name} className="rounded-xl bg-[var(--surface-subtle)] px-3.5 py-3"><p className="text-sm font-semibold">{exercise.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{exercise.sets} sets · {exercise.reps}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>updateStatus(nextWorkout.id,"completed","Completed as planned.")} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"><Check size={15}/>Complete</button><button onClick={()=>setSkipId(nextWorkout.id)} className="focus-ring inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"><X size={15}/>Skip</button><button disabled title="Available after Google Calendar is connected" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--muted-2)]"><CalendarCheck2 size={15}/>Reschedule</button></div></>}
      </section>

      <section className="card p-5 sm:p-6"><p className="eyebrow">Plan setup</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">Intermediate rebuild</h2><div className="mt-5 space-y-4"><PlanRow icon={Target} label="Goals" value="Leaner · upper body · abs"/><PlanRow icon={ShieldCheck} label="Weekly floor" value="3 protected lifts"/><PlanRow icon={Clock3} label="Session fit" value="60 or 75 minutes"/><PlanRow icon={Database} label="Hevy" value="Connected · baseline needed"/></div><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">Canvas workload scoring is planned, but not active. Calendar busyness alone will not cancel a protected lift.</div></section>
    </div>

    <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
      <div className="card p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><Sparkles size={18}/></span><div><p className="eyebrow">Program</p><h2 className="font-bold">Four-week return to consistency</h2></div></div><div className="mt-5 divide-y">{workoutTemplates.map((template)=><div key={template.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={cn("size-2 rounded-full",template.protected?"bg-emerald-500":"bg-slate-300")}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{template.title}</p><p className="truncate text-xs text-[var(--muted)]">{template.focus}</p></div><span className="text-xs font-medium text-[var(--muted)]">{template.protected?"Protected":"Optional"}</span></div>)}</div></div>
      <div className="card p-5 sm:p-6"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><TrendingUp size={18}/></span><p className="eyebrow mt-5">Progress</p><p className="mt-1 text-3xl font-bold tracking-[-.05em]">{completed}</p><p className="text-sm text-[var(--muted)]">workouts completed this week</p><p className="mt-5 text-xs leading-5 text-[var(--muted)]">Strength and volume trends unlock after Hevy has completed workout history.</p></div>
    </section>

    {skipId&&<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSkipId(null)}}><div role="dialog" aria-modal="true" aria-labelledby="skip-title" className="card w-full max-w-sm p-5"><h2 id="skip-title" className="text-lg font-bold">Why are you skipping?</h2><p className="mt-1 text-sm text-[var(--muted)]">This helps the future planner distinguish workload from fatigue.</p><div className="mt-5 grid gap-2">{["Too much academic work","Fatigue or recovery","Not enough time","Other"].map((reason)=><button key={reason} onClick={()=>updateStatus(skipId,"skipped",reason)} className="focus-ring rounded-xl border px-4 py-3 text-left text-sm font-semibold hover:bg-[var(--surface-subtle)]">{reason}</button>)}</div><button onClick={()=>setSkipId(null)} className="mt-3 w-full py-2 text-sm font-semibold text-[var(--muted)]">Cancel</button></div></div>}
    {previewOpen&&<FitnessCalendarPreview events={previewEvents} onClose={()=>setPreviewOpen(false)}/>}
  </div>;
}

function Metric({value,label}:{value:string;label:string}){return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"><p className="text-lg font-bold">{value}</p><p className="mt-0.5 text-[.62rem] uppercase tracking-wider text-slate-400">{label}</p></div>}
function WorkoutCard({workout,index}:{workout:PlannedWorkout;index:number}){return <article className={cn("card p-4",workout.status==="completed"&&"border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20",workout.status==="skipped"&&"opacity-60")}><div className="flex items-center justify-between"><span className="text-[.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{workout.protected?`Protected ${index+1}`:"Optional"}</span><span className={cn("rounded-full px-2 py-1 text-[.62rem] font-bold",workout.protected?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300":"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{workout.status.replace("_"," ")}</span></div><p className="mt-4 font-bold">{workout.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{format(new Date(workout.liftStart),"EEE · h:mm a")} · {workout.durationMinutes} min</p><p className="mt-4 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{workout.reason}</p></article>}
function PlanRow({icon:Icon,label,value}:{icon:typeof Target;label:string;value:string}){return <div className="flex items-center gap-3"><Icon size={16} className="text-[var(--muted)]"/><span className="flex-1 text-sm font-medium">{label}</span><span className="text-right text-xs text-[var(--muted)]">{value}</span></div>}

function FitnessCalendarPreview({events,onClose}:{events:import("@/domain/calendar").CalendarEvent[];onClose:()=>void}){const days=Array.from({length:7},(_,index)=>new Date(startOfWeek(new Date(),{weekStartsOn:1}).getTime()+index*24*60*60*1000));return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}><div role="dialog" aria-modal="true" aria-labelledby="fitness-calendar-title" className="card w-full max-w-5xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Schedule preview</p><h2 id="fitness-calendar-title" className="mt-1 text-xl font-bold">Workouts, highlighted</h2></div><button onClick={onClose} className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold">Close</button></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">{days.map(day=>{const dayEvents=events.filter(event=>new Date(event.start).getFullYear()===day.getFullYear()&&new Date(event.start).getMonth()===day.getMonth()&&new Date(event.start).getDate()===day.getDate());return <section key={day.toISOString()} className="min-h-36 rounded-xl border p-3"><p className="text-xs font-bold">{format(day,"EEE d")}</p><div className="mt-3 space-y-2">{dayEvents.length?dayEvents.map(event=><div key={event.id} className={cn("rounded-lg border px-2 py-1.5 text-[.68rem] font-semibold",event.automationType==="workout"?"border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100":"border-slate-200 bg-[var(--surface-subtle)] text-[var(--muted)]")}><p className="truncate">{event.title}</p><p className="mt-0.5 opacity-70">{format(new Date(event.start),"h:mm a")}</p></div>):<p className="text-xs text-[var(--muted-2)]">Open</p>}</div></section>})}</div></div></div>}
