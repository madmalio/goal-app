"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { dbService } from "../utils/db"; // UPDATED import

interface PrivacyContextType {
  isLocked: boolean;
  hasPin: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  setAutoLockTimer: (minutes: number) => void;
  refreshPinStatus: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLockState = localStorage.getItem("is_app_locked");
    if (savedLockState === "true") setIsLocked(true);
    refreshPinStatus();
  }, []);

  // UPDATED: Check local DB instead of API
  const refreshPinStatus = async () => {
    try {
      const settings = await dbService.getSettings();
      // If privacy_pin is strictly not null/empty
      setHasPin(!!settings && !!settings.privacy_pin);
    } catch (err) {
      console.error("Failed to check PIN status", err);
      setHasPin(false);
    }
  };

  const getStoredTimer = () => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("auto_lock_minutes")) || 0;
  };

  const lockApp = () => {
    setIsLocked(true);
    localStorage.setItem("is_app_locked", "true");
  };

  const unlockApp = () => {
    setIsLocked(false);
    localStorage.setItem("is_app_locked", "false");
    resetTimer();
  };

  const setAutoLockTimer = (minutes: number) => {
    localStorage.setItem("auto_lock_minutes", String(minutes));
    resetTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = getStoredTimer();
    if (minutes > 0 && !isLocked) {
      timerRef.current = setTimeout(() => lockApp(), minutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    const handleActivity = () => resetTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    resetTimer();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLocked, mounted]);

  return (
    <PrivacyContext.Provider
      value={{
        isLocked,
        hasPin,
        lockApp,
        unlockApp,
        setAutoLockTimer,
        refreshPinStatus,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error("usePrivacy error");
  return context;
}
