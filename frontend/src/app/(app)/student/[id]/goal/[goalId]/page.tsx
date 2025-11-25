"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchFromAPI } from "../../../../../../utils/api";
import ConfirmModal from "../../../../../../components/ConfirmModal";
import GoalChart from "../../../../../../components/GoalChart";

// ... (Helper functions getPromptBadges, getBehaviorIcon, etc. remain same) ...
// To save space, assume standard helpers are here.
// COPY THE HELPER FUNCTIONS FROM THE PREVIOUS TURN HERE
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

const getBehaviorIcon = (behavior: string) => {
  switch (behavior) {
    case "Positive":
      return (
        <span className="text-emerald-500 font-bold" title="Positive">
          ●
        </span>
      );
    case "Neutral":
      return (
        <span className="text-slate-400 font-bold" title="Neutral">
          ●
        </span>
      );
    case "Refusal":
      return (
        <span className="text-red-500 font-bold" title="Refusal">
          ●
        </span>
      );
    default:
      return null;
  }
};

const ToggleBtn = ({ label, selected, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-md text-sm font-semibold transition-all border shadow-sm print:hidden ${
      selected
        ? "bg-indigo-600 border-indigo-600 text-white ring-1 ring-indigo-400"
        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`}
  >
    {label}
  </button>
);

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const DownloadIcon = () => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

export default function TrackingPage() {
  const params = useParams();
  const goalId = params.goalId;
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [goalInfo, setGoalInfo] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [scoreNum, setScoreNum] = useState("");
  const [scoreDenom, setScoreDenom] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [compliance, setCompliance] = useState("");
  const [behavior, setBehavior] = useState("");
  const [hasManipulatives, setHasManipulatives] = useState(false);
  const [manipulativesType, setManipulativesType] = useState("");
  const [notes, setNotes] = useState("");

  // Mastery State
  const [isMastered, setIsMastered] = useState(false);

  useEffect(() => {
    loadData();
    const savedTeacher = localStorage.getItem("teacherName");
    if (savedTeacher) setTeacherName(savedTeacher);
  }, [goalId]);

  const loadData = async () => {
    try {
      const logData = await fetchFromAPI(`/logs?goal_id=${goalId}`);
      setLogs(logData);
      const goalData = await fetchFromAPI(`/goals/${goalId}`);
      setGoalInfo(goalData);
    } catch (e) {
      console.error(e);
    }
  };

  // CHECK MASTERY STATUS
  useEffect(() => {
    if (!logs.length || !goalInfo) return;

    const target = goalInfo.mastery_score || 80;
    const requiredCount = goalInfo.mastery_count || 3;

    let streak = 0;
    // Check latest logs first (logs are sorted DESC by date in backend)
    for (const log of logs) {
      let percent = 0;
      if (log.score.includes("/")) {
        const [n, d] = log.score.split("/").map(Number);
        if (d > 0) percent = (n / d) * 100;
      } else {
        percent = parseFloat(log.score) || 0;
      }

      if (percent >= target) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    setIsMastered(streak >= requiredCount);
  }, [logs, goalInfo]);

  const stats = useMemo(() => {
    if (!logs.length) return { average: "N/A", count: 0 };
    let totalPercent = 0;
    let count = 0;
    logs.forEach((l) => {
      if (l.score && l.score.includes("/")) {
        const [num, den] = l.score.split("/").map(Number);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          totalPercent += num / den;
          count++;
        }
      } else {
        const val = parseFloat(l.score);
        if (!isNaN(val)) {
          totalPercent += val / 100;
          count++;
        }
      }
    });
    return {
      count: logs.length,
      average:
        count > 0 ? Math.round((totalPercent / count) * 100) + "%" : "N/A",
    };
  }, [logs]);

  // ... (Edit, Delete, Submit Handlers remain same - assume included) ...
  const handleEditClick = (log: any) => {
    setEditingId(log.id);
    setDate(log.log_date.split("T")[0]);
    if (log.score.includes("/")) {
      const [n, d] = log.score.split("/");
      setScoreNum(n);
      setScoreDenom(d);
    } else {
      setScoreNum(log.score);
      setScoreDenom("");
    }
    setTimeSpent(log.time_spent);
    setPrompts(log.prompt_level ? log.prompt_level.split(", ") : []);
    setCompliance(log.compliance);
    setBehavior(log.behavior);
    setHasManipulatives(log.manipulatives_used);
    setManipulativesType(log.manipulatives_type);
    setNotes(log.notes || "");
  };

  const togglePrompt = (p: string) => {
    setPrompts((prev) => {
      if (prev.includes(p)) return prev.filter((item) => item !== p);
      return [...prev, p];
    });
  };

  const handleDeleteClick = (id: number) => setDeleteModalId(id);

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    try {
      await fetchFromAPI(`/logs/${deleteModalId}`, { method: "DELETE" });
      loadData();
      if (editingId === deleteModalId) handleCancelEdit();
    } catch (err) {
      alert("Failed to delete");
    } finally {
      setDeleteModalId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setScoreNum("");
    setScoreDenom("");
    setTimeSpent("");
    setPrompts([]);
    setCompliance("");
    setBehavior("");
    setHasManipulatives(false);
    setManipulativesType("");
    setNotes("");
    setDate(new Date().toLocaleDateString("en-CA"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalScore =
        scoreNum && scoreDenom ? `${scoreNum}/${scoreDenom}` : scoreNum;
      const finalPrompts = prompts.join(", ");
      const payload = {
        goal_id: Number(goalId),
        log_date: date,
        score: finalScore,
        time_spent: timeSpent,
        prompt_level: finalPrompts,
        compliance,
        behavior,
        manipulatives_used: hasManipulatives,
        manipulatives_type: hasManipulatives ? manipulativesType : "",
        notes,
      };
      if (editingId) {
        await fetchFromAPI(`/logs/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setEditingId(null);
      } else {
        await fetchFromAPI("/logs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      loadData();
    } catch (err) {
      alert("Failed to save log");
    }
  };

  const handleExportCSV = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";
      const res = await fetch(`${API_URL}/goals/${goalId}/export`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Goal_Report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export CSV");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* --- PRINT LAYOUT --- */}
      <div className="hidden print:block font-sans text-black p-10">
        {/* ... (Same Print Layout as before) ... */}
        <div className="border-b-2 border-slate-300 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Progress Report
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">
              Generated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600">
              Provider: {teacherName || "________________"}
            </p>
          </div>
        </div>
        {goalInfo && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8 border border-slate-200 rounded-lg p-6">
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                  Student Name
                </span>
                <span className="block text-xl font-bold">
                  {goalInfo.student_name}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                  Student ID
                </span>
                <span className="block text-xl">{goalInfo.student_id_str}</span>
              </div>
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                  Goal / Subject
                </span>
                <span className="block text-xl font-bold text-indigo-900">
                  {goalInfo.subject}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                  IEP Date
                </span>
                <span className="block text-xl">
                  {new Date(goalInfo.iep_date).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                <span className="block text-xs uppercase font-bold text-slate-400 mb-1">
                  Goal Description
                </span>
                <p className="text-base leading-relaxed">
                  {goalInfo.description}
                </p>
              </div>
            </div>

            {/* PRINT MASTERY STATUS */}
            {isMastered && (
              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <h3 className="text-emerald-700 font-bold uppercase tracking-wider text-sm">
                  Goal Mastered
                </h3>
                <p className="text-emerald-600 text-sm">
                  Student has met the criteria of {goalInfo.mastery_score}%
                  accuracy over {goalInfo.mastery_count} consecutive sessions.
                </p>
              </div>
            )}

            <div className="flex gap-8 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500">
                  Total Sessions
                </span>
                <div className="mt-1 font-bold text-3xl">{stats.count}</div>
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-500">
                  Average Accuracy
                </span>
                <div className="mt-1 font-bold text-3xl text-indigo-600">
                  {stats.average}
                </div>
              </div>
            </div>
            <table className="w-full text-sm mb-8">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3 text-left rounded-l-md">Date</th>
                  <th className="p-3 text-left">Score</th>
                  <th className="p-3 text-left">Prompts</th>
                  <th className="p-3 text-left">Support</th>
                  <th className="p-3 text-left">Compliance</th>
                  <th className="p-3 text-left rounded-r-md">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const promptBadges = getPromptBadges(log.prompt_level);
                  return (
                    <Fragment key={log.id}>
                      <tr>
                        <td className="p-3 whitespace-nowrap font-medium">
                          {new Date(log.log_date).toLocaleDateString(
                            undefined,
                            { timeZone: "UTC" }
                          )}
                        </td>
                        <td className="p-3 font-bold">{log.score}</td>
                        <td className="p-3 flex gap-1">
                          {promptBadges.map((b, i) => (
                            <span
                              key={i}
                              className="text-xs border px-1 rounded"
                            >
                              {b.label}
                            </span>
                          ))}
                        </td>
                        <td className="p-3">
                          {log.manipulatives_used ? `Yes` : "No"}
                        </td>
                        <td className="p-3">
                          {log.compliance} / {log.behavior}
                        </td>
                        <td className="p-3">{log.time_spent || "-"}</td>
                      </tr>
                      {log.notes && (
                        <tr className="bg-slate-50/50">
                          <td
                            colSpan={6}
                            className="p-3 italic text-xs text-slate-500 pl-8"
                          >
                            <span className="font-bold not-italic">Note:</span>{" "}
                            {log.notes}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-slate-300 pt-2 text-xs text-slate-500 text-center">
              <span className="mx-2">
                <strong>HOH</strong> = Hand over Hand
              </span>
              <span className="mx-2">
                <strong>VIP</strong> = Visual Prompt
              </span>
              <span className="mx-2">
                <strong>VP</strong> = Verbal Prompt
              </span>
              <span className="mx-2">
                <strong>IND</strong> = Independent
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Track Progress
          </h1>
          {/* WEB MASTERY BADGE */}
          {isMastered && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full border border-emerald-200 animate-pulse">
              Goal Mastered!
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700"
          >
            <DownloadIcon /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>{" "}
            Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 block print:block">
        {/* INPUT FORM (Same as before) */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          <form
            onSubmit={handleSubmit}
            className={`border p-6 rounded-xl space-y-6 shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 ${
              editingId ? "border-indigo-500/50" : ""
            }`}
          >
            {editingId && (
              <div className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 px-3 py-2 rounded text-sm font-bold flex justify-between items-center">
                <span>EDITING MODE</span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Time Spent
                </label>
                <input
                  type="text"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="e.g. 15 min"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Score (Correct / Total)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={scoreNum}
                    onChange={(e) => setScoreNum(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center"
                  />
                  <span className="text-slate-400 font-bold text-xl">/</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={scoreDenom}
                    onChange={(e) => setScoreDenom(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Prompts Used (Select all that apply)
              </label>
              <div className="flex gap-2">
                {["HOH", "VIP", "VP", "Independent"].map((p) => (
                  <ToggleBtn
                    key={p}
                    label={p}
                    selected={prompts.includes(p)}
                    onClick={() => togglePrompt(p)}
                  />
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-md p-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    HOH
                  </span>{" "}
                  Hand over Hand
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    VIP
                  </span>{" "}
                  Visual Prompt
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    VP
                  </span>{" "}
                  Verbal Prompt
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    IND
                  </span>{" "}
                  Independent
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  Behavior
                </label>
                <div className="flex flex-col gap-2">
                  {["Positive", "Neutral", "Refusal"].map((b) => (
                    <ToggleBtn
                      key={b}
                      label={b}
                      selected={behavior === b}
                      onClick={() => setBehavior(b)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  Compliance
                </label>
                <div className="flex flex-col gap-2">
                  {["Fully", "Partially", "Reminders"].map((c) => (
                    <ToggleBtn
                      key={c}
                      label={c}
                      selected={compliance === c}
                      onClick={() => setCompliance(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-700 dark:text-zinc-300">
                  Used Manipulatives?
                </label>
                <input
                  type="checkbox"
                  checked={hasManipulatives}
                  onChange={(e) => setHasManipulatives(e.target.checked)}
                  className="w-5 h-5 accent-indigo-500"
                />
              </div>
              {hasManipulatives && (
                <select
                  value={manipulativesType}
                  onChange={(e) => setManipulativesType(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Select Type...</option>
                  <option value="Visual Aid">Visual Aid</option>
                  <option value="Counters">Counters</option>
                  <option value="Tracing">Tracing</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Session Notes
              </label>
              <textarea
                rows={3}
                placeholder="Anecdotal data..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="pt-4 flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-1/3 py-3 rounded-md font-bold transition-colors shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`w-full py-3 font-bold rounded-md shadow-sm transition-colors ${
                  editingId
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {editingId ? "Update Log Entry" : "Save Log Entry"}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm border bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 print:w-full print:h-auto print:bg-white print:border-0 print:shadow-none print:block">
          <div className="print:hidden bg-slate-50 border-b border-slate-200 dark:bg-zinc-950 dark:border-zinc-800">
            {/* FIX: Pass Target Score to Chart */}
            <GoalChart logs={logs} targetScore={goalInfo?.mastery_score} />
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
                  <th className="p-3 border-b border-slate-200 dark:border-zinc-800">
                    Date
                  </th>
                  <th className="p-3 border-b border-slate-200 dark:border-zinc-800">
                    Score
                  </th>
                  <th className="p-3 border-b border-slate-200 dark:border-zinc-800">
                    Prompts
                  </th>
                  <th className="p-3 border-b border-slate-200 dark:border-zinc-800">
                    Context
                  </th>
                  <th className="p-3 border-b border-slate-200 dark:border-zinc-800 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {logs.map((log) => {
                  const behaviorIcon = getBehaviorIcon(log.behavior);
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
                      <td className="p-3 font-mono whitespace-nowrap text-slate-500 dark:text-zinc-400">
                        <div>
                          {new Date(log.log_date).toLocaleDateString(
                            undefined,
                            {
                              month: "numeric",
                              day: "numeric",
                              timeZone: "UTC",
                            }
                          )}
                        </div>
                        {log.time_spent && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-600">
                            {log.time_spent}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.score}
                        </span>
                      </td>
                      <td className="p-3 flex flex-wrap gap-1">
                        {promptBadges.map((badge, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {behaviorIcon}
                            <span className="text-slate-600 dark:text-zinc-400 font-medium">
                              {log.compliance || "-"}
                            </span>
                          </div>
                          {log.manipulatives_used && (
                            <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-600">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-[10px] italic">
                                {log.manipulatives_type}
                              </span>
                            </div>
                          )}
                          {log.notes && (
                            <div
                              className="flex items-center gap-1 text-indigo-500"
                              title={log.notes}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span className="text-[10px] truncate max-w-[80px]">
                                Note...
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditClick(log)}
                            className="text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors"
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
                            onClick={() => handleDeleteClick(log.id)}
                            className="text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
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
      </div>
      <ConfirmModal
        isOpen={deleteModalId !== null}
        onClose={() => setDeleteModalId(null)}
        onConfirm={confirmDelete}
        title="Delete Log Entry?"
        message="Are you sure you want to delete this record? This cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
