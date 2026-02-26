"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";

interface DurationChartProps {
  data: { range: string; avgViews: number; count: number }[];
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function DurationChart({ data }: DurationChartProps) {
  // Find optimal duration (highest avg views)
  const optimal = data.reduce(
    (best, item) => (item.avgViews > best.avgViews ? item : best),
    { range: "", avgViews: 0, count: 0 }
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="range"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCompact}
        />
        <Tooltip
          contentStyle={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fafafa",
          }}
          formatter={(value: number | undefined) => [
            formatCompact(value ?? 0),
            "Avg Views",
          ]}
        />
        <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
          {data.map((item) => (
            <Cell
              key={item.range}
              fill={item.range === optimal.range ? "#22c55e" : "#ec4899"}
              fillOpacity={item.range === optimal.range ? 1 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
