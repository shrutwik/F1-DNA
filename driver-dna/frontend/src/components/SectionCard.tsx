import type { CSSProperties, PropsWithChildren } from "react";

interface SectionCardProps extends PropsWithChildren {
  id?: string;
  title: string;
  subtitle?: string;
  accentColor: string;
}

export function SectionCard({
  id,
  title,
  subtitle,
  accentColor,
  children
}: SectionCardProps) {
  return (
    <section
      id={id}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/30"
      style={{ "--accent": accentColor } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--accent) 35%, var(--accent) 65%, transparent 100%)"
        }}
      />
      <header className="mb-4 border-b border-white/10 pb-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </header>
      <div className="text-slate-200">{children}</div>
    </section>
  );
}
