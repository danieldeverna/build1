export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow&&<p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="text-3xl font-bold tracking-[-0.055em] sm:text-[2.15rem]">{title}</h1>{description&&<p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}</div>{actions&&<div className="shrink-0">{actions}</div>}</div>;
}
