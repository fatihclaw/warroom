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
} from "recharts";

interface ViralityChartProps {
  data: Record<string, number>;
}

const COLORS = [
  "#a1a1aa", // Below 1x (gray)
  "#ec4899", // 1x-5x (pink)
  "#d946ef", // 5x-10x
  "#a855f7", // 10x-25x
  "#8b5cf6", // 25x-50x
  "#6366f1", // 50x-100x
  "#22c55e", // 100x+ (green - exceptional)
];

export function ViralityChart({ data }: ViralityChartProps) {
  const chartData = Object.entries(data).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="range"
          tick={{ fill: "#a1a1aa", fontSize: 10 }}
          axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fafafa",
          }}
          formatter={(value: number | undefined) => [value ?? 0, "Videos"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
