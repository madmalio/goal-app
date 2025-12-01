"use client";

import { useState, useEffect } from "react";
import { dbService } from "../utils/db";
import { backupService } from "../utils/backupService";
import { useBackup } from "../context/BackupContext";
import { useToast } from "../context/ToastContext";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Profile, 2 = Backup

  // Form State
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { refreshBackupStatus } = useBackup();
  const toast = useToast();

  useEffect(() => {
    checkIfNewUser();
  }, []);

  const checkIfNewUser = async () => {
    try {
      const settings = await dbService.getSettings();
      // If no teacher name is set, assume it's a new install
      if (!settings.teacher_name) {
        setIsOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateProfile(teacherName, schoolName);
      setStep(2); // Move to Backup Step
    } catch (e) {
      toast.error("Failed to save profile");
    }
  };

  const handleSetupBackup = async () => {
    setIsConnecting(true);
    try {
      if (backupService.isSupported()) {
        // --- MODERN AUTO-SAVE PATH ---

        // 1. Prime the user so they expect the window
        toast.info("Please select a location to save your backup file...");

        // 2. FORCE THE POPUP by calling initializeHandle directly
        await backupService.initializeHandle();

        // 3. Perform the first save to verify
        await backupService.performBackup();

        await refreshBackupStatus(); // Syncs the rest of the app!
        toast.success("Auto-Backup Enabled!");
        setIsOpen(false);
      } else {
        // --- FALLBACK PATH (Safari/Firefox/Mobile) ---
        // Manually download the file so they have a copy

        const jsonString = await dbService.exportBackup();
        const blob = new Blob([jsonString], { type: "application/json" });
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

        // Mark as backed up in context
        await refreshBackupStatus();

        toast.success(
          "Backup downloaded (Auto-save not supported on this browser)"
        );
        setIsOpen(false);
      }
    } catch (err) {
      console.error(err);
      // Don't show confusing errors if they just cancelled the popup
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipBackup = () => {
    setIsOpen(false);
    toast.success("Welcome aboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-8">
        {/* STEP 1: PROFILE */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome to Goal Master
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 mt-2">
                Let's get your classroom set up. Data is stored{" "}
                <strong>locally on this device</strong> for maximum privacy.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Teacher Name
                </label>
                <input
                  required
                  autoFocus
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="e.g. Ms. Frizzle"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  School Name
                </label>
                <input
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="e.g. Walkerville Elementary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all mt-4 shadow-lg shadow-indigo-500/20"
              >
                Continue →
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: BACKUP SETUP */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8"
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
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Enable Auto-Save?
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
                Since data is local, if you clear your browser cache,{" "}
                <strong>data will be lost</strong>.
                <br />
                <br />
                We recommend enabling Auto-Save to sync directly to your hard
                drive. A browser window will pop up to ask for a save location.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleSetupBackup}
                disabled={isConnecting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
              >
                {isConnecting ? "Connecting..." : "Enable Auto-Save"}
              </button>
              <button
                onClick={handleSkipBackup}
                className="text-slate-400 text-sm hover:text-slate-600 dark:hover:text-zinc-300 underline"
              >
                I'll do this later in Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
