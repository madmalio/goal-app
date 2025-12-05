"use client";

import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { initDB } from "../utils/db";
import { ToastProvider } from "../context/ToastContext";
import { PrivacyProvider } from "../context/PrivacyContext";
import { BackupProvider } from "../context/BackupContext";
import { StudentProvider } from "../context/StudentContext";
import { InstallProvider } from "../context/InstallContext"; // <--- NEW IMPORT

/* --- LogoIcon with vertical centering (Option 1: translate up) --- */
function LogoIcon({
  className = "w-10 h-10 text-white",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-label="Vaute shield with graduation hat"
    >
      {/* Move entire icon up slightly for optical center */}
      <g transform="translate(0,-0.7)">
        {/* Rounded crown shield */}
        <path
          d="M12 22s8-4 8-10V5Q12 2 4 5v7c0 6 8 10 8 10z"
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
        {/* Mortarboard */}
        <path
          d="M12 6L6.5 10L12 14L17.5 10Z"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* Tassel */}
        <path d="M17.5 10V14" strokeWidth={1.6} strokeLinecap="round" />
        {/* Cap base/bowl */}
        <path
          d="M8.5 11.5v1.5a3.5 3.5 0 0 0 7 0v-1.5"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const startUp = async () => {
      try {
        // Create tables (students, logs, settings) if they don't exist
        await initDB();
        setIsDbReady(true);
      } catch (err) {
        console.error("Database initialization failed:", err);
      }
    };

    startUp();
  }, []);

  // --- SPLASH SCREEN ---
  if (!isDbReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors">
        <div className="flex flex-col items-center animate-fade-in">
          {/* LOGO ICON (Vaute + vertically centered) */}
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6 rotate-3 animate-pulse">
            <LogoIcon className="w-10 h-10 text-white" />
          </div>

          {/* APP NAME (optional: rename) */}
          <h1 className="text-3xl font-black tracking-widest text-slate-900 dark:text-white uppercase mb-2">
            Vaute
          </h1>

          {/* LOADING TEXT */}
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <span className="text-sm font-medium text-slate-400 dark:text-zinc-500 ml-1">
              Loading Secure Workspace
            </span>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <p className="absolute bottom-8 text-xs text-slate-300 dark:text-zinc-700">
          Local-First Secure Environment
        </p>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <PrivacyProvider>
          <BackupProvider>
            <StudentProvider>
              <InstallProvider>{children}</InstallProvider>
            </StudentProvider>
          </BackupProvider>
        </PrivacyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
