"use client";

import { useState, useEffect, useRef } from "react";
import { dbService } from "../../utils/db";
import { backupService } from "../../utils/backupService";
import { useBackup } from "../../context/BackupContext";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../ConfirmModal";

export default function DataManagementSection() {
  const toast = useToast();
  const { refreshBackupStatus, isAutoEnabled } = useBackup();
  const [hasFileSystemSupport, setHasFileSystemSupport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modals
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasFileSystemSupport(backupService.isSupported());
  }, []);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
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
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error("Failed to generate backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleSetupAutoBackup = async () => {
    try {
      toast.info("Please select a location to save your backup file...");
      await backupService.initializeHandle();
      await backupService.performBackup();
      await refreshBackupStatus();
      toast.success("Auto-Backup connected!");
    } catch (e) {
      // User cancelled
    }
  };

  const confirmDisconnect = async () => {
    await backupService.disconnect();
    await refreshBackupStatus();
    toast.info("Auto-save disconnected.");
    setShowDisconnectModal(false);
  };

  // --- MISSING FUNCTION ADDED HERE ---
  const handleConfirmRestoreDb = () => {
    // This triggers the invisible file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      await dbService.restoreBackup(text);
      toast.success("Restored! Reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Invalid backup file.");
    } finally {
      setUploading(false);
      setShowRestoreModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">
        Data Management
      </h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
        All data is stored locally. Back up regularly!
      </p>

      {/* MANUAL ACTIONS */}
      <div className="flex gap-4 mb-6">
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
          </svg>{" "}
          Export Backup
        </button>
        <button
          onClick={() => setShowRestoreModal(true)}
          disabled={downloading || uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
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
          </svg>{" "}
          Import / Restore
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>

      {/* AUTO BACKUP SECTION */}
      {hasFileSystemSupport && (
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              Automation
            </h3>
            {/* STATUS BADGE */}
            {isAutoEnabled ? (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active
              </span>
            ) : (
              <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700">
                Inactive
              </span>
            )}
          </div>

          {isAutoEnabled ? (
            // ACTIVE STATE
            <div className="flex items-center justify-between p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 rounded-full">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    Auto-Save Active
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/80">
                    Data syncs to your hard drive automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-md hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            // INACTIVE STATE
            <div>
              <button
                onClick={handleSetupAutoBackup}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50 transition-colors"
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
                </svg>{" "}
                Connect Auto-Backup File
              </button>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                A browser window will pop up asking you to pick a save location.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleConfirmRestoreDb}
        title="Restore Database?"
        message="This will overwrite ALL data."
        confirmText="Select File"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={confirmDisconnect}
        title="Disconnect Auto-Save?"
        message="Your data will no longer automatically save to your hard drive. You will need to manually backup data to ensure safety."
        confirmText="Disconnect"
        isDestructive={true}
      />
    </section>
  );
}
