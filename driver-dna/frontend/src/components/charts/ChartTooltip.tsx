interface TooltipPayloadItem {
  name?: string;
  value?: string | number;
  color?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-3 shadow-xl shadow-black/40">
      {label !== undefined ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.fill ?? "#fff" }}
              />
              <span className="text-xs text-zinc-300">{entry.name ?? "Value"}</span>
            </div>
            <span className="text-xs font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
