"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper to parse "8/10", "80%", or "80" into a number
const parseScore = (score: string): number | null => {
  if (!score) return null;
  const clean = score.trim().replace("%", "");

  // Handle "8/10" fraction format
  if (clean.includes("/")) {
    const [num, den] = clean.split("/");
    return (parseFloat(num) / parseFloat(den)) * 100;
  }

  // Handle standard number
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
};

export default function GoalChart({ logs }: { logs: any[] }) {
  // 1. Prepare Data: Reverse logs (Oldest -> Newest) and parse scores
  const data = [...logs]
    .reverse()
    .map((log) => ({
      date: new Date(log.log_date).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      }),
      score: parseScore(log.score),
      originalScore: log.score, // Keep text for tooltip
    }))
    .filter((d) => d.score !== null); // Remove non-numeric entries

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-zinc-600 text-sm border-b border-slate-100 dark:border-zinc-800">
        Not enough data to chart
      </div>
    );
  }

  return (
    <div className="h-52 w-full p-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            domain={[0, 100]} // Assumes 0-100 scale, remove if using raw counts
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            cursor={{ stroke: "#6366f1", strokeWidth: 2 }}
            formatter={(value: number, name: string, props: any) => [
              props.payload.originalScore,
              "Score",
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1" // Indigo-500
            strokeWidth={3}
            dot={{ fill: "#fff", stroke: "#6366f1", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
