"use client";

import GoalChart from "./GoalChart";
import { TrackingLog } from "../utils/db";

// --- ICONS (Restored from original file) ---

const PuzzleIcon = ({ className = "w-3 h-3" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7h2a2 2 0 114 0h2a2 2 0 012 2v2a2 2 0 010 4v2a2 2 0 01-2 2h-2a2 2 0 01-4 0H8a2 2 0 01-2-2v-2a2 2 0 010-4V9a2 2 0 012-2z"
    />
  </svg>
);

const NoteIcon = ({ className = "w-3 h-3" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 4h8a2 2 0 012 2v6l-6 6H8a2 2 0 01-2-2V6a2 2 0 012-2z"
    />
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 14v4m0-4h4"
    />
  </svg>
);

// --- HELPERS ---

const getBehaviorColor = (behavior: string) => {
  switch (behavior) {
    case "Positive":
      return "text-emerald-500";
    case "Neutral":
      return "text-amber-500";
    case "Refusal":
      return "text-red-500";
    default:
      return "text-slate-300";
  }
};

const getPromptBadges = (levelString: string) => {
  if (!levelString) return [{ label: "-", color: "text-slate-400" }];
  const levels = levelString.split(",").map((s) => s.trim());
  return levels.map((l) => {
    switch (l) {
      case "Independent":
      case "IND":
        return {
          label: "IND",
          color:
            "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        };
      case "Verbal Prompt":
      case "VP":
        return {
          label: "VP",
          color:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        };
      case "Visual Prompt":
      case "VIP":
        return {
          label: "VIP",
          color:
            "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        };
      case "Hand over Hand":
      case "HOH":
        return {
          label: "HOH",
          color:
            "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
        };
      default:
        return { label: l, color: "text-slate-500 bg-slate-100" };
    }
  });
};

interface LogHistoryTableProps {
  logs: TrackingLog[];
  targetScore?: number;
  masteryEnabled?: boolean;
  onEdit: (log: TrackingLog) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
}

export default function LogHistoryTable({
  logs,
  targetScore,
  masteryEnabled,
  onEdit,
  onDelete,
  editingId,
}: LogHistoryTableProps) {
  return (
    <div className="rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm border bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 print:w-full print:h-auto print:bg-white print:border-0 print:shadow-none print:block">
      <div className="print:hidden bg-slate-50 border-b border-slate-200 dark:bg-zinc-950 dark:border-zinc-800">
        <GoalChart
          logs={logs}
          targetScore={masteryEnabled ? targetScore : undefined}
        />
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
          <h3 className="font-medium text-slate-900 dark:text-white">
            History Log
          </h3>
        </div>
      </div>
      <div className="overflow-auto flex-1 p-0 print:overflow-visible">
        <table className="w-full text-left border-collapse print:hidden">
          <thead className="text-xs uppercase tracking-wider sticky top-0 bg-slate-50 text-slate-500 dark:bg-zinc-950 dark:text-zinc-500">
            <tr>
              <th className="p-3 border-b border-slate-200 dark:border-zinc-800 w-18">
                Date
              </th>
              <th className="p-3 border-b border-slate-200 dark:border-zinc-800 w-24">
                Score
              </th>
              <th className="p-3 border-b border-slate-200 dark:border-zinc-800 w-24">
                Prompts
              </th>
              <th className="p-3 border-b border-slate-200 dark:border-zinc-800">
                Context
              </th>
              <th className="p-3 border-b border-slate-200 dark:border-zinc-800 w-20 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {logs.map((log) => {
              const behaviorColor = getBehaviorColor(log.behavior);
              const promptBadges = getPromptBadges(log.prompt_level);
              return (
                <tr
                  key={log.id}
                  className={`text-sm transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${
                    editingId === log.id
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : ""
                  }`}
                >
                  <td className="p-3 font-mono whitespace-nowrap text-slate-500 dark:text-zinc-400 align-top">
                    <div className="font-medium">
                      {new Date(log.log_date).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </div>
                    {log.time_spent && (
                      <div className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1">
                        {log.time_spent}
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      {log.score}
                    </span>
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {promptBadges.map((badge, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                        <span className={`text-[10px] ${behaviorColor}`}>
                          ●
                        </span>
                        <span className="font-medium">
                          {log.compliance || "No Data"}
                        </span>
                      </div>
                      {log.manipulatives_used && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-xs italic">
                          <PuzzleIcon />
                          <span>
                            {log.manipulatives_type || "Manipulatives"}
                          </span>
                        </div>
                      )}
                      {log.notes && (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[11px]">
                          <NoteIcon />
                          <span>Note</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(log)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors"
                      >
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(log.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
