"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { fetchFromAPI } from "../../../utils/api";
import ConfirmModal from "../../../components/ConfirmModal";

// Icons
const SunIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const SystemIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

interface Student {
  id: number;
  name: string;
  student_id: string;
  active: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Settings State
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  // Modals & Data State
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRestoreDbModal, setShowRestoreDbModal] = useState(false);
  const [showSaveDefaultsModal, setShowSaveDefaultsModal] = useState(false); // NEW: Save Modal
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archived Students State
  const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
  const [studentToRestore, setStudentToRestore] = useState<Student | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
    const savedTeacher = localStorage.getItem("teacherName");
    const savedSchool = localStorage.getItem("schoolName");
    if (savedTeacher) setTeacherName(savedTeacher);
    if (savedSchool) setSchoolName(savedSchool);

    loadArchivedStudents();
  }, []);

  const loadArchivedStudents = async () => {
    try {
      const data = await fetchFromAPI("/students?archived=true");
      setArchivedStudents(data);
    } catch (err) {
      console.error("Failed to load archived students", err);
    }
  };

  // --- ACTIONS ---

  // 1. Unarchive Student
  const handleUnarchiveClick = (student: Student) => {
    setStudentToRestore(student);
  };

  const confirmUnarchive = async () => {
    if (!studentToRestore) return;
    try {
      await fetchFromAPI(`/students/${studentToRestore.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: studentToRestore.name,
          student_id: studentToRestore.student_id,
          active: true,
        }),
      });
      loadArchivedStudents();
      window.location.reload();
    } catch (err) {
      alert("Failed to restore student");
    } finally {
      setStudentToRestore(null);
    }
  };

  // 2. Save Defaults
  const confirmSaveDefaults = () => {
    localStorage.setItem("teacherName", teacherName);
    localStorage.setItem("schoolName", schoolName);
    setShowSaveDefaultsModal(false);
    // Optional: Could add a small "Toast" notification here instead of an alert
  };

  // 3. Data Management (Download/Restore)
  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";
      const res = await fetch(`${API_URL}/backup`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goal-master-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };
  const handleConfirmRestoreDb = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await fetchFromAPI("/restore", {
        method: "POST",
        body: JSON.stringify(json),
      });
      alert("Database restored successfully! The page will now reload.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to restore backup.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold dark:text-white text-slate-900">
        App Settings
      </h1>

      {/* 1. APPEARANCE */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 dark:text-white text-slate-800">
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${
              theme === "light"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <SunIcon />
            <span className="font-medium text-sm">Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${
              theme === "dark"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <MoonIcon />
            <span className="font-medium text-sm">Dark</span>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${
              theme === "system"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <SystemIcon />
            <span className="font-medium text-sm">System</span>
          </button>
        </div>
      </section>

      {/* 2. REPORT DEFAULTS */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">
          Report Defaults
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
          Details for printed reports.
        </p>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Teacher / Provider Name
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Ms. Frizzle"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              School / District Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Walkerville Elementary"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowSaveDefaultsModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Save Defaults
          </button>
        </div>
      </section>

      {/* 3. DATA MANAGEMENT */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">
          Data Management
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
          Export your data for backup, or restore from a previous backup file.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadBackup}
            disabled={downloading || uploading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-md font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {downloading ? "Downloading..." : "Export Database"}
          </button>
          <button
            onClick={() => setShowRestoreDbModal(true)}
            disabled={downloading || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md font-medium hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {uploading ? "Restoring..." : "Restore Database"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </section>

      {/* 4. ARCHIVED STUDENTS */}
      {archivedStudents.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">
            Archived Students
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
            These students are hidden from the sidebar. Click "Restore" to make
            them active again.
          </p>

          <div className="space-y-3">
            {archivedStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 border-slate-200 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    ID: {s.student_id}
                  </p>
                </div>
                <button
                  onClick={() => handleUnarchiveClick(s)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: RESTORE DATABASE */}
      <ConfirmModal
        isOpen={showRestoreDbModal}
        onClose={() => setShowRestoreDbModal(false)}
        onConfirm={handleConfirmRestoreDb}
        title="Restore Database?"
        message="This action will permanently delete all current students, goals, and logs and replace them with the data from your backup file. This cannot be undone."
        confirmText="Yes, Restore Everything"
        isDestructive={true}
      />

      {/* MODAL: UNARCHIVE STUDENT */}
      <ConfirmModal
        isOpen={!!studentToRestore}
        onClose={() => setStudentToRestore(null)}
        onConfirm={confirmUnarchive}
        title="Restore Student?"
        message={`Are you sure you want to restore ${studentToRestore?.name}? They will reappear in the main sidebar.`}
        confirmText="Restore"
        isDestructive={false}
      />

      {/* MODAL: SAVE DEFAULTS */}
      <ConfirmModal
        isOpen={showSaveDefaultsModal}
        onClose={() => setShowSaveDefaultsModal(false)}
        onConfirm={confirmSaveDefaults}
        title="Update Report Defaults?"
        message="These details will be automatically applied to the signature line of all future printed reports. Do you want to save these changes?"
        confirmText="Save Changes"
        isDestructive={false}
      />

      <section className="bg-indigo-50 dark:bg-zinc-900/50 border border-indigo-100 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">
          About Goal Master
        </h3>
        <p className="text-sm text-indigo-700 dark:text-zinc-400 mt-1">
          Version 1.0.0 • Local Chromebook Edition
        </p>
      </section>
    </div>
  );
}
