import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { QualiRaceMetric } from "../../types/api";
import { ChartTooltip } from "./ChartTooltip";

interface QualiRaceChartProps {
  metric?: QualiRaceMetric;
  accentColor: string;
}

export function QualiRaceChart({ metric, accentColor }: QualiRaceChartProps) {
  const rows = (metric?.rounds ?? [])
    .map((round) => ({
      round: round.round,
      delta: round.grid_minus_finish
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
            name="Grid minus Finish"
            stroke={accentColor}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
