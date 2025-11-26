"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { fetchFromAPI } from "../utils/api";

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
  // FIX: Default false to prevent flash on login
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

  const refreshPinStatus = async () => {
    try {
      const res = await fetchFromAPI("/user/pin");
      setHasPin(res.has_pin);
    } catch (err) {
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
