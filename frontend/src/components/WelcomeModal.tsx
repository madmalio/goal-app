"use client";

import { useState, useEffect } from "react";
import { dbService } from "../utils/db";
import { backupService } from "../utils/backupService";
import { useBackup } from "../context/BackupContext";
import { usePrivacy } from "../context/PrivacyContext"; // <--- Import Privacy Context
import { useToast } from "../context/ToastContext";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Profile, 2 = Backup, 3 = PIN

  // Form State
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [pin, setPin] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { refreshBackupStatus } = useBackup();
  const { refreshPinStatus } = usePrivacy(); //To update the lock icon state
  const toast = useToast();

  useEffect(() => {
    checkIfNewUser();
  }, []);

  const checkIfNewUser = async () => {
    try {
      const settings = await dbService.getSettings();
      if (!settings.teacher_name) {
        setIsOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- STEP 1: PROFILE ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateProfile(teacherName, schoolName);
      setStep(2);
    } catch (e) {
      toast.error("Failed to save profile");
    }
  };

  // --- STEP 2: BACKUP ---
  const handleSetupBackup = async () => {
    setIsConnecting(true);
    try {
      if (backupService.isSupported()) {
        toast.info("Please select a location to save your backup file...");
        await backupService.initializeHandle();
        await backupService.performBackup();
        await refreshBackupStatus();
        toast.success("Auto-Backup Enabled!");
      } else {
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
        await refreshBackupStatus();
        toast.success("Backup downloaded (Auto-save not supported)");
      }
      setStep(3); // Move to PIN
    } catch (err) {
      // If cancelled, just stay on step 2 or let them skip manually
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipBackup = () => {
    setStep(3); // Move to PIN
  };

  // --- STEP 3: PIN ---
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    try {
      await dbService.setPin(pin);
      await refreshPinStatus();
      toast.success("Security PIN Set!");
      setIsOpen(false); // FINISHED!
    } catch (err) {
      toast.error("Failed to set PIN");
    }
  };

  const handleSkipPin = () => {
    setIsOpen(false); // FINISHED!
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
                drive.
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
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SECURITY PIN (NEW) */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Set a Security PIN
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">
                Prevent prying eyes. Set a 4-digit code to quickly lock the
                screen when you step away from your desk.
              </p>
            </div>

            <form onSubmit={handleSetPin} className="space-y-4">
              <div className="flex justify-center">
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-48 text-center text-3xl tracking-[0.5em] py-3 rounded-lg border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                  placeholder="••••"
                />
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={pin.length !== 4}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Set PIN & Finish
                </button>
                <button
                  type="button"
                  onClick={handleSkipPin}
                  className="text-slate-400 text-sm hover:text-slate-600 dark:hover:text-zinc-300 underline"
                >
                  Skip Security
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
