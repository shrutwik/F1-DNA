import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ThrottleAggressionMetric } from "../../types/api";
import { ChartTooltip } from "./ChartTooltip";

interface ThrottleChartProps {
  metric?: ThrottleAggressionMetric;
  accentColor: string;
}

export function ThrottleChart({ metric, accentColor }: ThrottleChartProps) {
  const driver = metric?.avg_throttle_pct_corner_exit;
  const teammate = metric?.teammate_avg_throttle_pct_corner_exit;
  if (driver === null || driver === undefined || teammate === null || teammate === undefined) {
    return <p className="text-sm text-slate-400">Not enough data for this metric yet.</p>;
  }

  const data = [
    { name: "Driver", value: driver },
    { name: "Teammate", value: teammate }
  ];

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="#27272a" />
          <XAxis dataKey="name" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill={accentColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
