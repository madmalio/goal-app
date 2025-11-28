"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Helper: Parse "8/10", "80%", or "80" into a number
const parseScore = (score: string): number | null => {
  if (!score) return null;
  const clean = score.trim().replace("%", "");
  // Handle "8/10" fraction format
  if (clean.includes("/")) {
    const [num, den] = clean.split("/");
    if (parseFloat(den) === 0) return 0;
    return Math.round((parseFloat(num) / parseFloat(den)) * 100);
  }
  // Handle standard number
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
};

// Helper: Simple Linear Regression (y = mx + b)
const calculateTrendLine = (data: any[]) => {
  const n = data.length;
  if (n < 2) return [];

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;

  // X is index (0, 1, 2...), Y is score
  data.forEach((point, i) => {
    sumX += i;
    sumY += point.score;
    sumXY += i * point.score;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate trend points
  return data.map((point, i) => ({
    date: point.date,
    trend: Math.round(slope * i + intercept),
  }));
};

export default function GoalChart({
  logs,
  targetScore,
}: {
  logs: any[];
  targetScore?: number;
}) {
  // 1. Prepare Data (Oldest -> Newest)
  const rawData = [...logs]
    .reverse()
    .map((log) => ({
      date: new Date(log.log_date).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
      }),
      score: parseScore(log.score),
      originalScore: log.score,
    }))
    .filter((d) => d.score !== null);

  // 2. Calculate Trend
  const trendData = calculateTrendLine(rawData);

  // 3. Merge Data for Chart
  const chartData = rawData.map((point, i) => ({
    ...point,
    trend: trendData[i]?.trend,
  }));

  if (chartData.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-zinc-600 text-sm border-b border-slate-100 dark:border-zinc-800">
        Not enough data to show trends
      </div>
    );
  }

  return (
    <div className="h-52 w-full p-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            cursor={{ stroke: "#6366f1", strokeWidth: 2 }}
            // Custom Formatter to label the lines
            formatter={(value: number, name: string, props: any) => {
              if (name === "trend") return [value + "%", "Trend"];
              return [props.payload.originalScore, "Score"];
            }}
          />

          {/* MASTERY TARGET LINE (Only if enabled) */}
          {targetScore !== undefined && (
            <ReferenceLine
              y={targetScore}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Target: ${targetScore}%`,
                fill: "#ef4444",
                fontSize: 10,
                position: "insideBottomRight",
              }}
            />
          )}

          {/* ACTUAL DATA LINE */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1" // Indigo
            strokeWidth={3}
            dot={{ fill: "#fff", stroke: "#6366f1", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#6366f1" }}
          />

          {/* TREND LINE (Dotted Green) */}
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#10b981" // Emerald
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
