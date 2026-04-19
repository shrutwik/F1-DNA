import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BrakingProfileMetric } from "../../types/api";
import { ChartTooltip } from "./ChartTooltip";

interface BrakingChartProps {
  metric?: BrakingProfileMetric;
  accentColor: string;
}

export function BrakingChart({ metric, accentColor }: BrakingChartProps) {
  const rows = (metric?.by_circuit ?? [])
    .map((point) => ({
      round: point.round,
      delta: point.brake_onset_delta_m
    }))
    .filter((row) => row.delta !== null);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">Not enough data for this metric yet.</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="#27272a" />
          <XAxis dataKey="round" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="delta"
            name="Brake Delta (m)"
            stroke={accentColor}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
