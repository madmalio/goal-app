"use client";

import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { initDB } from "../utils/db";

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
        // Even if it fails, we might want to let the app load so the user sees an error
        // rather than a white screen, but for now, we wait.
      }
    };

    startUp();
  }, []);

  if (!isDbReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-400 animate-pulse">
        Initializing Workspace...
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
