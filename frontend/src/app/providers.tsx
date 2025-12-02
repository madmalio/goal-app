"use client";

import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { initDB } from "../utils/db";
import { ToastProvider } from "../context/ToastContext";
import { PrivacyProvider } from "../context/PrivacyContext";
import { BackupProvider } from "../context/BackupContext";
import { StudentProvider } from "../context/StudentContext";

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
          {/* LOGO ICON */}
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6 rotate-3 animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
          </div>

          {/* APP NAME */}
          <h1 className="text-3xl font-black tracking-widest text-slate-900 dark:text-white uppercase mb-2">
            Goal Master
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
            <StudentProvider>{children}</StudentProvider>
          </BackupProvider>
        </PrivacyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
