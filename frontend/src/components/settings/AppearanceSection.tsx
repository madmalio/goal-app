"use client";

import { useTheme } from "next-themes";

const SunIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const SystemIcon = () => (
  <svg
    className="w-6 h-6 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const btnClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${
      isActive
        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
        : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`;

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 dark:text-white text-slate-800">
        Appearance
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setTheme("light")}
          className={btnClass(theme === "light")}
        >
          <SunIcon /> <span className="font-medium text-sm">Light</span>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={btnClass(theme === "dark")}
        >
          <MoonIcon /> <span className="font-medium text-sm">Dark</span>
        </button>
        <button
          onClick={() => setTheme("system")}
          className={btnClass(theme === "system")}
        >
          <SystemIcon /> <span className="font-medium text-sm">System</span>
        </button>
      </div>
    </section>
  );
}
