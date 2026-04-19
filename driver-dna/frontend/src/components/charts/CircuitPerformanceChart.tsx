import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CircuitPerformanceMetric } from "../../types/api";
import { ChartTooltip } from "./ChartTooltip";

interface CircuitPerformanceChartProps {
  metric?: CircuitPerformanceMetric;
  accentColor: string;
}

export function CircuitPerformanceChart({
  metric,
  accentColor
}: CircuitPerformanceChartProps) {
  const rows = (metric?.rounds ?? [])
    .map((round) => ({
      round: round.round,
      score: round.expected_minus_actual
    }))
    .filter((row) => row.score !== null);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">Not enough data for this metric yet.</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="#27272a" />
          <XAxis dataKey="round" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="score" fill={accentColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
