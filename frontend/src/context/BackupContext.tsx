"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dbService } from "../utils/db";
import { backupService } from "../utils/backupService"; // <--- Import this

interface BackupContextType {
  lastBackupDate: Date | null;
  isLoading: boolean;
  isAutoEnabled: boolean; // <--- NEW: Track connection status
  refreshBackupStatus: () => Promise<void>;
}

const BackupContext = createContext<BackupContextType | undefined>(undefined);

export function BackupProvider({ children }: { children: React.ReactNode }) {
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [isAutoEnabled, setIsAutoEnabled] = useState(false); // <--- Default false
  const [isLoading, setIsLoading] = useState(true);

  const refreshBackupStatus = async () => {
    try {
      // 1. Check Date
      const settings = await dbService.getSettings();
      if (settings?.last_backup_at) {
        setLastBackupDate(new Date(settings.last_backup_at));
      } else {
        setLastBackupDate(null);
      }

      // 2. Check Auto-Save Handle (NEW)
      if (backupService.isSupported()) {
        const handle = await backupService.getStoredHandle();
        setIsAutoEnabled(!!handle); // True if handle exists
      }
    } catch (e) {
      console.error("Failed to fetch backup status", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBackupStatus();
  }, []);

  return (
    <BackupContext.Provider
      value={{ lastBackupDate, isLoading, isAutoEnabled, refreshBackupStatus }}
    >
      {children}
    </BackupContext.Provider>
  );
}

export function useBackup() {
  const context = useContext(BackupContext);
  if (!context)
    throw new Error("useBackup must be used within a BackupProvider");
  return context;
}
