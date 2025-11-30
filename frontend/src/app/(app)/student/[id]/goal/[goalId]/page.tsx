"use client";

import { useState, useEffect, Fragment, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { dbService, TrackingLog } from "../../../../../../utils/db";
import ConfirmModal from "../../../../../../components/ConfirmModal";
import GoalChart from "../../../../../../components/GoalChart";
import { useToast } from "../../../../../../context/ToastContext";

// --- UI HELPERS ---

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

// ✅ Dot color map for behavior indicator
const getBehaviorColor = (behavior: string) => {
  switch (behavior) {
    case "Positive":
      return "text-emerald-500"; // green
    case "Neutral":
      return "text-amber-500"; // yellow
    case "Refusal":
      return "text-red-500"; // red
    default:
      return "text-slate-300";
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

// --- ICONS ---
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
const MicIcon = () => (
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
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);
const StopIcon = () => (
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
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 10a1 1 0 011-1h4a1 1 0 01-1-1v-4z"
    />
  </svg>
);
const MagicIcon = () => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
const PrinterIcon = () => (
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
      d="M6 9V4h12v5M6 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-1M6 14h12v8H6v-8z"
    />
  </svg>
);

// Minimal inline icons for Context column
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

export default function TrackingPage() {
  const params = useParams();
  const goalId = Number((params as any).goalId);
  const router = useRouter();
  const toast = useToast();

  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [goalInfo, setGoalInfo] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportSettings, setReportSettings] = useState({
    school: "",
    teacher: "",
  });
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

  const [isMastered, setIsMastered] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    dbService
      .getSettings()
      .then((s) =>
        setReportSettings({ school: s.school_name, teacher: s.teacher_name })
      );
    loadData();
  }, [goalId]);

  const loadData = async () => {
    try {
      const logData = await dbService.getLogs(goalId);
      setLogs(logData);
      const goalData = await dbService.getGoal(goalId);
      setGoalInfo(goalData);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load tracking data");
    }
  };

  useEffect(() => {
    if (!logs.length || !goalInfo) return;
    if (!goalInfo.mastery_enabled) {
      setIsMastered(false);
      return;
    }
    const target = goalInfo.mastery_score || 80;
    const requiredCount = goalInfo.mastery_count || 3;
    let streak = 0;
    for (const log of logs) {
      let percent = 0;
      if (log.score.includes("/")) {
        const [n, d] = log.score.split("/").map(Number);
        if (d > 0) percent = (n / d) * 100;
      } else {
        percent = parseFloat(log.score) || 0;
      }
      if (percent >= target) streak++;
      else break;
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

  const handleEditClick = (log: TrackingLog) => {
    setEditingId(log.id);
    setDate(log.log_date);
    if (log.score && log.score.includes("/")) {
      const [n, d] = log.score.split("/");
      setScoreNum(n);
      setScoreDenom(d);
    } else {
      setScoreNum(log.score || "");
      setScoreDenom("");
    }
    setTimeSpent(log.time_spent || "");
    setPrompts(log.prompt_level ? log.prompt_level.split(", ") : []);
    setCompliance(log.compliance || "");
    setBehavior(log.behavior || "");
    setHasManipulatives(log.manipulatives_used || false);
    setManipulativesType(log.manipulatives_type || "");
    setNotes(log.notes || "");
  };

  const togglePrompt = (p: string) => {
    setPrompts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser does not support voice.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setNotes((prev) => (prev + " " + transcript).trim());
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleGenerateNarrative = () => {
    const parts: string[] = [];
    const firstName = goalInfo?.student_name
      ? goalInfo.student_name.split(" ")[0]
      : "The student";

    if (compliance && behavior)
      parts.push(
        `${firstName} was ${compliance.toLowerCase()} compliant and demonstrated ${behavior.toLowerCase()} behavior.`
      );
    else if (compliance)
      parts.push(`${firstName} was ${compliance.toLowerCase()} compliant.`);
    else if (behavior)
      parts.push(
        `${firstName} demonstrated ${behavior.toLowerCase()} behavior.`
      );

    if (scoreNum) {
      let perf = `They achieved a score of ${scoreNum}`;
      if (scoreDenom) perf += `/${scoreDenom}`;
      if (prompts.length > 0) {
        const expand: Record<string, string> = {
          HOH: "Hand-over-Hand",
          VIP: "Visual Prompts",
          VP: "Verbal Prompts",
          IND: "Independence",
        };
        const pText = prompts.map((p) => expand[p] || p).join(" and ");
        perf += ` with ${pText}`;
      }
      parts.push(perf + ".");
    }

    if (hasManipulatives)
      parts.push(
        `Manipulatives${
          manipulativesType ? ` (${manipulativesType})` : ""
        } were utilized.`
      );
    if (timeSpent) parts.push(`Duration: ${timeSpent}.`);

    if (parts.length === 0) {
      toast.error("Fill in some data first.");
      return;
    }

    const narrative = parts.join(" ");
    setNotes((prev) => (prev ? prev + "\n" + narrative : narrative));
    toast.success("Narrative generated!");
  };

  const handleDeleteClick = (id: number) => setDeleteModalId(id);

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    try {
      await dbService.deleteLog(deleteModalId);
      loadData();
      if (editingId === deleteModalId) handleCancelEdit();
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete");
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
      const payload: Partial<TrackingLog> = {
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
        await dbService.updateLog(editingId, payload);
        setEditingId(null);
      } else {
        await dbService.createLog(payload);
      }
      resetForm();
      loadData();
      toast.success("Log saved successfully");
    } catch {
      toast.error("Failed to save log");
    }
  };

  const handleExportCSV = () => {
    try {
      if (!logs.length) {
        toast.error("No logs to export");
        return;
      }

      const headers = [
        "Date",
        "Score",
        "Prompts",
        "Used Manipulatives",
        "Manipulative Type",
        "Compliance",
        "Behavior",
        "Time Spent",
        "Notes",
      ];
      const rows = logs.map((l) => [
        l.log_date,
        l.score,
        `"${l.prompt_level || ""}"`,
        l.manipulatives_used ? "Yes" : "No",
        l.manipulatives_type || "",
        l.compliance || "",
        l.behavior || "",
        l.time_spent || "",
        `"${(l.notes || "").replace(/"/g, '""')}"`,
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${goalInfo?.student_name || "Student"}_${
          goalInfo?.subject || "Goal"
        }_Report.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* --- PRINT LAYOUT (compact) --- */}
      <div className="hidden print:block font-sans text-black p-8">
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
            <p>School: {reportSettings.school || "________________"}</p>
            <p>Teacher: {reportSettings.teacher || "________________"}</p>
          </div>
        </div>

        {goalInfo && (
          <div className="mb-6">
            {/* Header cards */}
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
                <span className="block text-base">
                  {goalInfo.student_id_str}
                </span>
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
                <p className="text-[12px] leading-snug">
                  {goalInfo.description}
                </p>
              </div>
            </div>

            {/* Mastery banner */}
            {isMastered && goalInfo.mastery_enabled && (
              <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-emerald-700 font-semibold uppercase tracking-wider text-xs">
                  Goal Mastered — {goalInfo.mastery_score}% over{" "}
                  {goalInfo.mastery_count} sessions
                </p>
              </div>
            )}

            {/* Totals */}
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

            {/* Print table */}
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
                  const complianceStr = [
                    log.compliance || "",
                    log.behavior || "",
                  ]
                    .filter(Boolean)
                    .join(" / ");

                  // compact note line
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
                      `Scored ${log.score}${
                        pTextFull ? ` with ${pTextFull}` : ""
                      }.`
                    );
                  if (log.manipulatives_used)
                    narrativeParts.push(
                      `Manipulatives${
                        log.manipulatives_type
                          ? ` (${log.manipulatives_type})`
                          : ""
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
                        <td
                          className="px-2 py-1 whitespace-nowrap"
                          valign="top"
                        >
                          {log.time_spent || ""}
                        </td>
                      </tr>
                      {(log.notes ||
                        log.manipulatives_used ||
                        complianceStr) && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-2 pb-2 pt-0 text-slate-700"
                          >
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

            {/* Legend centered */}
            <div className="text-[11px] text-slate-600 mt-3 text-center">
              <span className="font-bold">HOH</span> = Hand over
              Hand&nbsp;&nbsp;
              <span className="font-bold">VIP</span> = Visual Prompt&nbsp;&nbsp;
              <span className="font-bold">VP</span> = Verbal Prompt&nbsp;&nbsp;
              <span className="font-bold">IND</span> = Independent
            </div>
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
          {isMastered && goalInfo?.mastery_enabled && (
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
            <PrinterIcon /> Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 block print:block">
        {/* FORM */}
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
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
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
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Anecdotal data..."
                  className="w-full px-3 py-2 pb-12 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={handleGenerateNarrative}
                    className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                    title="Magic Narrative"
                  >
                    <MagicIcon />
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-all flex items-center justify-center ${
                      isListening
                        ? "bg-red-100 text-red-600 animate-pulse shadow-md ring-2 ring-red-200"
                        : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                    title={isListening ? "Stop Listening" : "Dictate Note"}
                  >
                    {isListening ? <StopIcon /> : <MicIcon />}
                  </button>
                </div>
              </div>
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

        {/* HISTORY TABLE (WEB VIEW) */}
        <div className="lg:col-span-5 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm border bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 print:w-full print:h-auto print:bg-white print:border-0 print:shadow-none print:block">
          <div className="print:hidden bg-slate-50 border-b border-slate-200 dark:bg-zinc-950 dark:border-zinc-800">
            <GoalChart
              logs={logs}
              targetScore={
                goalInfo?.mastery_enabled ? goalInfo.mastery_score : undefined
              }
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
                            onClick={() => handleEditClick(log)}
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
                            onClick={() => handleDeleteClick(log.id)}
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
      </div>

      <ConfirmModal
        isOpen={deleteModalId !== null}
        onClose={() => setDeleteModalId(null)}
        onConfirm={confirmDelete}
        title="Delete Log Entry?"
        message="Are you sure you want to delete this record? This cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
