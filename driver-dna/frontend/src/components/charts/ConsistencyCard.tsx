import type { ConsistencyMetric } from "../../types/api";

interface ConsistencyCardProps {
  metric?: ConsistencyMetric;
  accentColor: string;
}

export function ConsistencyCard({ metric, accentColor }: ConsistencyCardProps) {
  const std = metric?.laptime_std_seconds;
  const laps = metric?.lap_count;

  if (std === null || std === undefined || laps === null || laps === undefined || laps < 1) {
    return <p className="text-sm text-slate-400">Not enough data for this metric yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Lap Time Std Dev</p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">{std.toFixed(3)}s</p>
        <div className="mt-3 h-1 rounded-full bg-white/10">
          <div
            className="h-1 rounded-full"
            style={{ width: `${Math.min(100, Math.max(12, (1 - Math.min(std, 1)) * 100))}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Clean Laps Counted</p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">{laps}</p>
      </div>
    </div>
  );
}
