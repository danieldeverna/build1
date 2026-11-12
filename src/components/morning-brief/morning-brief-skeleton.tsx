export function MorningBriefTileSkeleton() {
  return <div className="card min-h-40 animate-pulse p-4 xl:min-h-36" aria-label="Loading Morning Brief"><div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-950"/><div className="mt-4 h-3 w-24 rounded bg-[var(--surface-subtle)]"/><div className="mt-3 h-5 w-3/4 rounded bg-[var(--surface-subtle)]"/><div className="mt-3 h-3 w-full rounded bg-[var(--surface-subtle)]"/></div>;
}

export function MorningBriefPageSkeleton() {
  return <div className="animate-pulse" aria-label="Loading Morning Brief"><div className="h-9 w-64 rounded bg-[var(--surface-subtle)]"/><div className="mt-3 h-4 w-80 max-w-full rounded bg-[var(--surface-subtle)]"/><div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]"><div className="card h-72 bg-[var(--surface-subtle)]"/><div className="space-y-4"><div className="card h-32 bg-[var(--surface-subtle)]"/><div className="card h-32 bg-[var(--surface-subtle)]"/></div></div></div>;
}
