"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchFromAPI } from "../../../../../../utils/api";
import ConfirmModal from "../../../../../../components/ConfirmModal";
import GoalChart from "../../../../../../components/GoalChart";

// --- UI HELPERS (Restored Badge Logic) ---
const getPromptBadge = (level: string) => {
  switch (level) {
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
      return { label: "-", color: "text-slate-400" };
  }
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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [score, setScore] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [compliance, setCompliance] = useState("");
  const [behavior, setBehavior] = useState("");
  const [hasManipulatives, setHasManipulatives] = useState(false);
  const [manipulativesType, setManipulativesType] = useState("");
  const [notes, setNotes] = useState("");

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

  const handleEditClick = (log: any) => {
    setEditingId(log.id);
    setDate(log.log_date.split("T")[0]);
    setScore(log.score);
    setTimeSpent(log.time_spent);
    setPrompt(log.prompt_level);
    setCompliance(log.compliance);
    setBehavior(log.behavior);
    setHasManipulatives(log.manipulatives_used);
    setManipulativesType(log.manipulatives_type);
    setNotes(log.notes || "");
  };

  const handleDeleteClick = (id: number) => {
    setDeleteModalId(id);
  };

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
    setScore("");
    setTimeSpent("");
    setPrompt("");
    setCompliance("");
    setBehavior("");
    setHasManipulatives(false);
    setManipulativesType("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        goal_id: Number(goalId),
        log_date: date,
        score,
        time_spent: timeSpent,
        prompt_level: prompt,
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* PRINT HEADER */}
      <div className="hidden print:block font-sans text-black mb-8">
        <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest">
              IEP Progress Report
            </h2>
            <p className="text-sm text-gray-600">
              Generated by: {teacherName || "Goal Master App"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Report Date</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        {goalInfo && (
          <div className="space-y-6">
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="w-1/2 p-2 border-r border-b border-black align-top">
                    <strong>Name:</strong>{" "}
                    <span className="ml-2">{goalInfo.student_name}</span>
                  </td>
                  <td className="w-1/2 p-2 border-b border-black align-top">
                    <strong>Student ID:</strong>{" "}
                    <span className="ml-2">{goalInfo.student_id_str}</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-black align-top">
                    <strong>Goal Subject:</strong>{" "}
                    <span className="ml-2">{goalInfo.subject}</span>
                  </td>
                  <td className="p-2 align-top">
                    <strong>Date of IEP:</strong>{" "}
                    <span className="ml-2">
                      {new Date(goalInfo.iep_date).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="p-2 align-top h-24">
                    <strong className="block mb-1">Goal:</strong>
                    <span>{goalInfo.description}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="p-2 align-middle font-medium">
                    <strong>Prompts:</strong> Hand over Hand (
                    <strong>HOH</strong>) Visual Prompt (<strong>VIP</strong>)
                    Verbal Prompt (<strong>VP</strong>) or was it Independent (
                    <strong>I</strong>)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WEB HEADER */}
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
        </div>
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
          </svg>
          Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 block print:block">
        {/* INPUT FORM */}
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
                <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wide">
                  Date
                </label>
                {/* RESTORED DATE PICKER */}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  onClick={(e) => e.currentTarget.showPicker()}
                  className="w-full rounded p-3 focus:border-indigo-500 outline-none border bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light] dark:bg-zinc-950 dark:border-zinc-700 dark:text-white dark:[color-scheme:dark] cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wide">
                  Time Spent
                </label>
                <input
                  type="text"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="e.g. 15 min"
                  className="w-full rounded p-3 focus:border-indigo-500 outline-none border bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wide">
                  Score / Data
                </label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 80%"
                  className="w-full rounded p-3 focus:border-indigo-500 outline-none border bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-wide">
                Prompts Used
              </label>
              <div className="flex gap-2">
                {["HOH", "VIP", "VP", "Independent"].map((p) => (
                  <ToggleBtn
                    key={p}
                    label={p}
                    selected={prompt === p}
                    onClick={() => setPrompt(p)}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-wide">
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
                <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-wide">
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
            <div className="p-4 rounded-lg border bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
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
                  className="w-full mt-2 rounded p-2 focus:border-indigo-500 outline-none border bg-white border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white"
                >
                  <option value="">Select Type...</option>
                  <option value="Visual Aid">Visual Aid</option>
                  <option value="Counters">Counters</option>
                  <option value="Tracing">Tracing</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wide">
                Session Notes
              </label>
              <textarea
                rows={3}
                placeholder="Anecdotal data..."
                className="w-full rounded p-3 focus:border-indigo-500 outline-none border bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
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

        {/* HISTORY CONTAINER */}
        <div className="lg:col-span-5 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm border bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 print:w-full print:h-auto print:bg-white print:border-0 print:shadow-none print:block">
          {/* CHART AREA */}
          <div className="print:hidden bg-slate-50 border-b border-slate-200 dark:bg-zinc-950 dark:border-zinc-800">
            <GoalChart logs={logs} />
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
              <h3 className="font-medium text-slate-900 dark:text-white">
                History Log
              </h3>
            </div>
          </div>

          <div className="overflow-auto flex-1 p-0 print:overflow-visible">
            {/* WEB VIEW TABLE */}
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
                  const promptBadge = getPromptBadge(log.prompt_level);
                  const behaviorIcon = getBehaviorIcon(log.behavior);
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
                            { month: "numeric", day: "numeric" }
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
                      <td className="p-3">
                        {log.prompt_level ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${promptBadge.color}`}
                          >
                            {promptBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-700">
                            -
                          </span>
                        )}
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
                          {/* NOTE INDICATOR */}
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

            {/* PRINT VIEW TABLE (Matches PDF) */}
            <table className="hidden print:table w-full text-left border-collapse border-2 border-black">
              <thead className="bg-gray-200 text-black text-xs font-bold uppercase">
                <tr>
                  <th className="p-2 border border-black">Date</th>
                  <th className="p-2 border border-black">Score</th>
                  <th className="p-2 border border-black">Prompts</th>
                  <th className="p-2 border border-black">Manipulatives?</th>
                  <th className="p-2 border border-black">Compliance</th>
                  <th className="p-2 border border-black">Behavior</th>
                  <th className="p-2 border border-black">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-xs text-black">
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-2 border border-black whitespace-nowrap">
                        {new Date(log.log_date).toLocaleDateString(undefined, {
                          month: "numeric",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="p-2 border border-black font-bold">
                        {log.score}
                      </td>
                      <td className="p-2 border border-black">
                        {log.prompt_level || "-"}
                      </td>
                      <td className="p-2 border border-black">
                        {log.manipulatives_used ? (
                          <span>Yes ({log.manipulatives_type})</span>
                        ) : (
                          "No"
                        )}
                      </td>
                      <td className="p-2 border border-black">
                        {log.compliance || "-"}
                      </td>
                      <td className="p-2 border border-black">
                        {log.behavior || "-"}
                      </td>
                      <td className="p-2 border border-black">
                        {log.time_spent || "-"}
                      </td>
                    </tr>
                    {log.notes && (
                      <tr className="bg-gray-50">
                        <td
                          colSpan={7}
                          className="p-2 border border-black italic text-gray-600"
                        >
                          <span className="font-bold">Note:</span> {log.notes}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
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
