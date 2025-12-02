"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface InstallContextType {
  installPrompt: any;
  isIOS: boolean;
  isStandalone: boolean;
  clearPrompt: () => void;
  waitForPrompt: (timeoutMs?: number) => Promise<any | null>;
}

const InstallContext = createContext<InstallContextType | undefined>(undefined);

// Global cache for Deferred Prompt (persists across mounts on a page)
let globalDeferredPrompt: any = null;

// ✅ Synchronous detections to avoid “first paint” hiding
const detectStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone);

const detectIOS = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

if (typeof window !== "undefined") {
  // Global listener — runs as soon as this module is evaluated
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event("goal-master-install-ready"));
  });
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<any>(globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState<boolean>(detectIOS());
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone());

  // Promise resolvers waiting for the prompt to arrive
  const waitersRef = useRef<((p: any | null) => void)[]>([]);

  useEffect(() => {
    // Keep flags up to date in case display-mode changes
    const media = window.matchMedia?.("(display-mode: standalone)");
    const onMode = () => setIsStandalone(detectStandalone());
    media?.addEventListener?.("change", onMode);

    // If the prompt already exists (from global cache), sync immediately
    if (globalDeferredPrompt) setInstallPrompt(globalDeferredPrompt);

    const handleReadySignal = () => {
      if (globalDeferredPrompt) {
        setInstallPrompt(globalDeferredPrompt);
        // Fulfill any pending waiters
        waitersRef.current.forEach((resolve) => resolve(globalDeferredPrompt));
        waitersRef.current = [];
      }
    };
    window.addEventListener("goal-master-install-ready", handleReadySignal);

    // Clear prompt when app gets installed
    const handleInstalled = () => {
      clearPrompt();
    };
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      media?.removeEventListener?.("change", onMode);
      window.removeEventListener(
        "goal-master-install-ready",
        handleReadySignal
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const clearPrompt = () => {
    setInstallPrompt(null);
    globalDeferredPrompt = null;
  };

  // Let consumers wait briefly for the prompt after a user clicks
  const waitForPrompt = (timeoutMs = 2000) =>
    new Promise<any | null>((resolve) => {
      if (globalDeferredPrompt) return resolve(globalDeferredPrompt);
      const timer = setTimeout(() => {
        // Timed out — resolve without a prompt
        resolve(null);
      }, timeoutMs);
      waitersRef.current.push((p) => {
        clearTimeout(timer);
        resolve(p);
      });
    });

  return (
    <InstallContext.Provider
      value={{ installPrompt, isIOS, isStandalone, clearPrompt, waitForPrompt }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstall must be used within InstallProvider");
  return ctx;
}
