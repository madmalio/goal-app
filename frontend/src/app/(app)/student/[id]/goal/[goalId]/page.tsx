"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { dbService, TrackingLog } from "@/utils/db";
import ConfirmModal from "@/components/ConfirmModal";
import TrackingForm from "@/components/TrackingForm";
import LogHistoryTable from "@/components/LogHistoryTable";
import PrintLayout from "@/components/PrintLayout";
import DateRangeFilter from "@/components/DateRangeFilter";
import { useToast } from "@/context/ToastContext";
import UpgradeModal from "@/components/UpgradeModal"; // <--- Import
import { APP_CONFIG } from "@/config"; // <--- Import

// --- ICONS ---
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

export default function TrackingPage() {
  const params = useParams();
  const goalId = Number((params as any).goalId);
  const router = useRouter();
  const toast = useToast();

  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [goalInfo, setGoalInfo] = useState<any>(null);
  const [editingLog, setEditingLog] = useState<TrackingLog | null>(null);
  const [reportSettings, setReportSettings] = useState({
    school: "",
    teacher: "",
  });
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [isMastered, setIsMastered] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showPaywall, setShowPaywall] = useState(false); // <--- New State

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

  // --- PAYWALL CHECKERS ---
  const checkPaywall = async () => {
    if (APP_CONFIG.ENABLE_PAYWALL) {
      const { license_status } = await dbService.getLicenseStatus();
      if (license_status !== "active") {
        setShowPaywall(true);
        return true; // Blocked
      }
    }
    return false; // Allowed
  };

  const handlePrintClick = async () => {
    if (await checkPaywall()) return;
    window.print();
  };

  const handleExportCSV = async () => {
    if (await checkPaywall()) return;

    if (!filteredLogs.length) {
      toast.error("No logs to export in this date range");
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
    const rows = filteredLogs.map((l) => [
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
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!startDate && !endDate) return true;
      const logDate = new Date(log.log_date);
      logDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
      return true;
    });
  }, [logs, startDate, endDate]);

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
    if (!filteredLogs.length) return { average: "N/A", count: 0 };
    let totalPercent = 0;
    let count = 0;
    filteredLogs.forEach((l) => {
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
      count: filteredLogs.length,
      average:
        count > 0 ? Math.round((totalPercent / count) * 100) + "%" : "N/A",
    };
  }, [filteredLogs]);

  const handleSubmitLog = async (data: Partial<TrackingLog>) => {
    try {
      if (editingLog) {
        await dbService.updateLog(editingLog.id, data);
        setEditingLog(null);
      } else {
        await dbService.createLog(data);
      }
      loadData();
      toast.success("Log saved successfully");
    } catch {
      toast.error("Failed to save log");
    }
  };

  const handleUpdateGoalPreference = async (
    newType: "fraction" | "percentage"
  ) => {
    if (goalInfo?.tracking_type !== newType) {
      try {
        await dbService.updateGoal(goalId, {
          ...goalInfo,
          tracking_type: newType,
        });
        loadData();
      } catch (e) {
        console.error("Failed to update preference", e);
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    try {
      await dbService.deleteLog(deleteModalId);
      loadData();
      if (editingLog?.id === deleteModalId) setEditingLog(null);
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteModalId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* PRINT LAYOUT */}
      <PrintLayout
        logs={filteredLogs}
        goalInfo={goalInfo}
        stats={stats}
        settings={reportSettings}
        isMastered={isMastered}
      />

      {/* HEADER */}
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
            onClick={handlePrintClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700"
          >
            <PrinterIcon /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 block print:block">
        {/* FORM */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          <TrackingForm
            studentName={goalInfo?.student_name || ""}
            goalId={goalId}
            initialData={editingLog}
            defaultScoreType={goalInfo?.tracking_type || "fraction"}
            onSubmit={handleSubmitLog}
            onCancel={() => setEditingLog(null)}
            onPreferenceUpdate={handleUpdateGoalPreference}
          />
        </div>

        {/* HISTORY */}
        <div className="lg:col-span-5">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
          <LogHistoryTable
            logs={filteredLogs}
            targetScore={
              goalInfo?.mastery_enabled ? goalInfo.mastery_score : undefined
            }
            masteryEnabled={goalInfo?.mastery_enabled}
            onEdit={setEditingLog}
            onDelete={setDeleteModalId}
            editingId={editingLog?.id || null}
          />
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
      <UpgradeModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
}
