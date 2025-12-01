"use client";

import { Fragment } from "react";
import { TrackingLog } from "../utils/db";

// --- HELPERS (Moved here for the report) ---
const getPromptBadges = (levelString: string) => {
  if (!levelString) return [{ label: "-", color: "text-slate-400" }];
  const levels = levelString.split(",").map((s) => s.trim());
  return levels.map((l) => {
    switch (l) {
      case "Independent":
      case "IND":
        return {
          label: "IND",
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "Verbal Prompt":
      case "VP":
        return {
          label: "VP",
          color: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "Visual Prompt":
      case "VIP":
        return {
          label: "VIP",
          color: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "Hand over Hand":
      case "HOH":
        return {
          label: "HOH",
          color: "bg-purple-100 text-purple-700 border-purple-200",
        };
      default:
        return { label: l, color: "text-slate-500 bg-slate-100" };
    }
  });
};

interface PrintLayoutProps {
  logs: TrackingLog[];
  goalInfo: any;
  stats: { count: number; average: string };
  settings: { school: string; teacher: string };
  isMastered: boolean;
}

export default function PrintLayout({
  logs,
  goalInfo,
  stats,
  settings,
  isMastered,
}: PrintLayoutProps) {
  if (!goalInfo) return null;

  return (
    <div className="hidden print:block font-sans text-black p-8">
      {/* Header */}
      <div className="border-b border-slate-300 pb-3 mb-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-0.5">
            Progress Report
          </h1>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <p className="font-semibold">
            Generated: {new Date().toLocaleDateString()}
          </p>
          <p>School: {settings.school || "________________"}</p>
          <p>Teacher: {settings.teacher || "________________"}</p>
        </div>
      </div>

      <div className="mb-6">
        {/* Student/Goal Info Cards */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 border border-slate-200 rounded-lg p-4 text-[12px] leading-tight">
          <div>
            <span className="block uppercase font-bold text-slate-500 mb-0.5 text-[10px]">
              Student Name
            </span>
            <span className="block text-lg font-bold">
              {goalInfo.student_name}
            </span>
          </div>
          <div>
            <span className="block uppercase font-bold text-slate-500 mb-0.5 text-[10px]">
              Student ID
            </span>
            <span className="block text-base">{goalInfo.student_id_str}</span>
          </div>
          <div>
            <span className="block uppercase font-bold text-slate-500 mb-0.5 text-[10px]">
              Goal / Subject
            </span>
            <span className="block text-lg font-bold text-indigo-900">
              {goalInfo.subject}{" "}
              <span className="text-[11px] font-normal text-slate-600 ml-1">
                ({goalInfo.frequency})
              </span>
            </span>
          </div>
          <div>
            <span className="block uppercase font-bold text-slate-500 mb-0.5 text-[10px]">
              IEP Date
            </span>
            <span className="block text-base">
              {new Date(goalInfo.iep_date).toLocaleDateString(undefined, {
                timeZone: "UTC",
              })}
            </span>
          </div>
          <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
            <span className="block uppercase font-bold text-slate-500 mb-0.5 text-[10px]">
              Goal Description
            </span>
            <p className="text-[12px] leading-snug">{goalInfo.description}</p>
          </div>
        </div>

        {/* Mastery Banner */}
        {isMastered && goalInfo.mastery_enabled && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <p className="text-emerald-700 font-semibold uppercase tracking-wider text-xs">
              Goal Mastered — {goalInfo.mastery_score}% over{" "}
              {goalInfo.mastery_count} sessions
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mb-5 bg-slate-50 p-4 rounded-lg border border-slate-100 text-[12px] leading-tight">
          <div>
            <span className="uppercase font-bold text-slate-600 text-[10px]">
              Total Sessions
            </span>
            <div className="mt-0.5 font-bold text-2xl">{stats.count}</div>
          </div>
          <div>
            <span className="uppercase font-bold text-slate-600 text-[10px]">
              Average Accuracy
            </span>
            <div className="mt-0.5 font-bold text-2xl text-indigo-700">
              {stats.average}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full text-[11px] mb-2 border-collapse leading-tight">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
            <tr>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Date
              </th>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Score
              </th>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Prompts
              </th>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Support
              </th>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Compliance
              </th>
              <th className="px-2 py-1 text-left border-b border-slate-300">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => {
              const promptBadges = getPromptBadges(log.prompt_level);
              const dateStr = new Date(log.log_date).toLocaleDateString(
                undefined,
                { timeZone: "UTC" }
              );
              const supportStr = log.manipulatives_used ? "Yes" : "No";
              const complianceStr = [log.compliance || "", log.behavior || ""]
                .filter(Boolean)
                .join(" / ");

              // Narrative Generator for Print
              const firstName = goalInfo?.student_name
                ? goalInfo.student_name.split(" ")[0]
                : "Student";
              const map: Record<string, string> = {
                HOH: "Hand-over-Hand",
                VIP: "Visual Prompt",
                VP: "Verbal Prompt",
                IND: "Independent",
              };
              const pTextFull = promptBadges
                .map((p) => map[p.label] || p.label)
                .join(" and ");

              const narrativeParts: string[] = [];
              if (complianceStr)
                narrativeParts.push(
                  `${firstName} was ${complianceStr.toLowerCase()}.`
                );
              if (log.score)
                narrativeParts.push(
                  `Scored ${log.score}${pTextFull ? ` with ${pTextFull}` : ""}.`
                );
              if (log.manipulatives_used)
                narrativeParts.push(
                  `Manipulatives${
                    log.manipulatives_type ? ` (${log.manipulatives_type})` : ""
                  } used.`
                );
              if (log.time_spent)
                narrativeParts.push(`Duration: ${log.time_spent}.`);
              if (log.notes) narrativeParts.push(log.notes);
              const compactNote = narrativeParts.join(" ");

              return (
                <Fragment key={log.id}>
                  <tr>
                    <td
                      className="px-2 py-1 whitespace-nowrap font-medium"
                      valign="top"
                    >
                      {dateStr}
                    </td>
                    <td className="px-2 py-1 font-bold" valign="top">
                      {log.score}
                    </td>
                    <td className="px-2 py-1" valign="top">
                      <div className="flex flex-wrap gap-1">
                        {promptBadges.map((b, i) => (
                          <span
                            key={i}
                            className="border px-1 rounded bg-white"
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1" valign="top">
                      {supportStr}
                    </td>
                    <td className="px-2 py-1" valign="top">
                      {complianceStr || "No Data"}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap" valign="top">
                      {log.time_spent || ""}
                    </td>
                  </tr>
                  {(log.notes || log.manipulatives_used || complianceStr) && (
                    <tr>
                      <td colSpan={6} className="px-2 pb-2 pt-0 text-slate-700">
                        <span className="font-semibold">Note:</span>{" "}
                        <span className="italic">{compactNote}</span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Legend */}
        <div className="text-[11px] text-slate-600 mt-3 text-center">
          <span className="font-bold">HOH</span> = Hand over Hand&nbsp;&nbsp;
          <span className="font-bold">VIP</span> = Visual Prompt&nbsp;&nbsp;
          <span className="font-bold">VP</span> = Verbal Prompt&nbsp;&nbsp;
          <span className="font-bold">IND</span> = Independent
        </div>
      </div>
    </div>
  );
}
