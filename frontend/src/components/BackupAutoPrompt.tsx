"use client";

import { useState, useEffect } from "react";
import { backupService } from "../utils/backupService";
import { useBackup } from "../context/BackupContext";
import { dbService } from "../utils/db";
import { useToast } from "../context/ToastContext";

export default function BackupAutoPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [daysSince, setDaysSince] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [hasFileSystemSupport, setHasFileSystemSupport] = useState(false);

  // Get isLoading from context
  const { lastBackupDate, refreshBackupStatus, isLoading } = useBackup();
  const toast = useToast();

  useEffect(() => {
    setHasFileSystemSupport(backupService.isSupported());
  }, []);

  // Update this useEffect to depend on isLoading
  useEffect(() => {
    if (!isLoading) {
      checkStatus();
    }
  }, [lastBackupDate, isLoading]);

  const checkStatus = async () => {
    // 1. If we have a recorded backup date
    if (lastBackupDate) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastBackupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        setDaysSince(diffDays);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      return;
    }

    // 2. If NO backup date exists
    try {
      const settings = await dbService.getSettings();

      // If new user (Welcome Modal handles this), stay closed
      if (!settings.teacher_name) {
        setIsOpen(false);
        return;
      }

      // If existing user with no backup, show alert
      setDaysSince(999);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      if (hasFileSystemSupport) {
        toast.info("Please select a location to save your backup file...");
        await backupService.performBackup();
        toast.success("Auto-Save Link Established! Data Saved.");
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
        toast.success("Backup downloaded successfully.");
      }

      await refreshBackupStatus();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Backup failed.");
    } finally {
      setIsBackingUp(false);
    }
  };

  if (isLoading) return null; // <--- The Fix: Don't render ANYTHING while loading
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-900/50 p-6 animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Data Safety Alert
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
              You haven't backed up your data in{" "}
              <strong className="text-red-600 dark:text-red-400">
                {daysSince === 999 ? "a while" : `${daysSince} days`}
              </strong>
              .
            </p>
            <p className="text-slate-400 dark:text-zinc-500 mt-1 text-xs">
              If your browser cache is cleared, your student data will be lost.
            </p>
          </div>

          <div className="w-full pt-2 space-y-3">
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isBackingUp ? (
                <span>Saving...</span>
              ) : hasFileSystemSupport ? (
                <>
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
                  Sync to Hard Drive
                </>
              ) : (
                <>
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
                  Download Backup File
                </>
              )}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 underline"
            >
              I'll risk it (Remind me later)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
