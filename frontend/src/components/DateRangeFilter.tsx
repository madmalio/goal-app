"use client";

import { useState, useEffect, useRef } from "react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

// --- ICONS ---
const FilterIcon = () => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const CalendarIcon = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const setRange = (days: number | "school_year" | "all") => {
    const end = new Date();
    let start = new Date();

    if (days === "all") {
      onChange("", "");
      // Optional: Close menu on "All Time" selection
      // setIsOpen(false);
      return;
    }

    if (days === "school_year") {
      const currentMonth = end.getMonth();
      const currentYear = end.getFullYear();
      // If Aug-Dec, start Aug 1 this year. Else start Aug 1 last year.
      const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      start = new Date(startYear, 7, 1);
    } else {
      start.setDate(end.getDate() - (days as number));
    }
    onChange(formatDate(start), formatDate(end));
  };

  // Helper to show active filter text
  const getActiveLabel = () => {
    if (!startDate && !endDate) return "All Time";
    if (startDate && endDate) {
      // Format nicely (e.g. 11/20/2024 - 12/20/2024)
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(
        endDate
      ).toLocaleDateString()}`;
    }
    return "Custom Filter";
  };

  return (
    <div className="relative mb-6 z-10 print:hidden" ref={menuRef}>
      {/* 1. THE MAIN BAR (Compact) */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Filter:
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
            {getActiveLabel()}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
            isOpen
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          <FilterIcon />
          <span>Date Range</span>
        </button>
      </div>

      {/* 2. THE DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-full sm:w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 animate-fade-in-down z-20">
          <div className="space-y-4">
            {/* Quick Select Buttons */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRange(30)}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-left"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setRange(90)}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-left"
                >
                  Last 90 Days
                </button>
                <button
                  onClick={() => setRange("school_year")}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-left"
                >
                  School Year
                </button>
                <button
                  onClick={() => setRange("all")}
                  className="px-3 py-2 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 text-left"
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Custom Range Inputs */}
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Custom Range
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">
                    <CalendarIcon />
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onChange(e.target.value, endDate)}
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-3 top-2.5 pointer-events-none">
                    Start
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">
                    <CalendarIcon />
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onChange(startDate, e.target.value)}
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-3 top-2.5 pointer-events-none">
                    End
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
