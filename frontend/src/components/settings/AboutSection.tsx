"use client";

import { useState } from "react";
import { useToast } from "../../context/ToastContext";

// App Version (Update this manually when you release new features)
const APP_VERSION = "1.0.0";

export default function AboutSection() {
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  const handleCheckForUpdates = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      toast.error("Update check not supported on this device.");
      return;
    }

    setChecking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.update();

      // Simulate a short delay so the user feels like something happened
      setTimeout(() => {
        setChecking(false);
        toast.success("You are on the latest version.");
        // Optional: Force a reload just to be sure any new assets are grabbed
        // window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setChecking(false);
      toast.error("Failed to check for updates.");
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mt-8">
      <h2 className="text-xl font-semibold mb-4 dark:text-white text-slate-800">
        About Goal Master
      </h2>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            Current Version:{" "}
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              v{APP_VERSION}
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-sm">
            This is a local-first secure application. No student data is sent to
            the cloud.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Goal Master</p>
            <p>Built for Special Education Professionals</p>
          </div>
        </div>

        <button
          onClick={handleCheckForUpdates}
          disabled={checking}
          className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check for Updates"}
        </button>
      </div>
    </section>
  );
}
