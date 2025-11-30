"use client";

import { useState, useEffect } from "react";
import { dbService } from "../utils/db";
import Link from "next/link";

export default function BackupStatus() {
  const [status, setStatus] = useState<"safe" | "warning" | "danger">("safe");
  const [daysAgo, setDaysAgo] = useState<number | null>(null);

  useEffect(() => {
    checkBackupStatus();
  }, []);

  const checkBackupStatus = async () => {
    try {
      const settings = await dbService.getSettings();
      if (!settings || !settings.last_backup_at) {
        setStatus("danger");
        setDaysAgo(null);
        return;
      }

      const last = new Date(settings.last_backup_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysAgo(diffDays);

      if (diffDays > 7) setStatus("danger");
      else if (diffDays > 3) setStatus("warning");
      else setStatus("safe");
    } catch (e) {
      console.error(e);
    }
  };

  // Hide if safe (to keep sidebar clean), only show warnings
  if (status === "safe") return null;

  return (
    <div className="px-4 pb-4">
      <Link href="/settings">
        <div
          className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
            status === "danger"
              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
          }`}
        >
          <div
            className={`p-1.5 rounded-full ${
              status === "danger"
                ? "bg-red-100 dark:bg-red-900/50"
                : "bg-amber-100 dark:bg-amber-900/50"
            }`}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase">
              {status === "danger" ? "Backup Required" : "Backup Reminder"}
            </p>
            <p className="text-[10px] opacity-80">
              {daysAgo === null
                ? "Never backed up"
                : `Last backup: ${daysAgo} days ago`}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
