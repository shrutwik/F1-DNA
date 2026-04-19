import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TyreDegradationMetric } from "../../types/api";
import { ChartTooltip } from "./ChartTooltip";

interface TyreChartProps {
  metric?: TyreDegradationMetric;
  accentColor: string;
}

export function TyreChart({ metric, accentColor }: TyreChartProps) {
  const slope = metric?.avg_laptime_slope_s_per_lap_within_stint;
  const segments = metric?.stint_segments_used ?? 0;

  if (slope === null || slope === undefined || segments <= 0) {
    return <p className="text-sm text-slate-400">Not enough data for this metric yet.</p>;
  }

  const points = Array.from({ length: Math.min(segments, 12) }, (_, index) => ({
    lap: index + 1,
    delta: Number((slope * index).toFixed(3))
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="#27272a" />
          <XAxis dataKey="lap" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="delta" stroke={accentColor} fill={accentColor} fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
