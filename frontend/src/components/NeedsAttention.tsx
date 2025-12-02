"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dbService, OverdueGoal } from "../utils/db";

const ClockIcon = () => (
  <svg
    className="w-5 h-5 text-amber-600 dark:text-amber-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const TrackIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

export default function NeedsAttention() {
  const [items, setItems] = useState<OverdueGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await dbService.getOverdueGoals();
      setItems(data.slice(0, 5)); // Limit to top 5 most critical
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-32 bg-slate-50 dark:bg-zinc-900 animate-pulse rounded-xl" />
    );

  if (items.length === 0) {
    return (
      <div className="p-6 rounded-xl border shadow-sm bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3 dark:bg-emerald-900/30 dark:text-emerald-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white">
          All Caught Up!
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          No goals are overdue for tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border shadow-sm bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-amber-100 rounded-md dark:bg-amber-900/30">
          <ClockIcon />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Needs Attention
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.goal_id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-colors dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-indigo-900"
          >
            <div>
              <p className="font-bold text-slate-900 text-sm dark:text-white">
                {item.student_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {item.subject} •{" "}
                <span className="font-medium text-amber-600 dark:text-amber-500">
                  {item.days_since} days
                </span>{" "}
                since log
              </p>
            </div>

            <Link
              href={`/student/${item.student_id}/goal/${item.goal_id}`}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-100 rounded-md hover:bg-indigo-50 shadow-sm dark:bg-zinc-900 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
            >
              <TrackIcon /> Track
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
