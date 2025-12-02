"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dbService, DashboardStats, Student } from "../../utils/db";
import { usePrivacy } from "../../context/PrivacyContext";
import NeedsAttention from "../../components/NeedsAttention";
import { useStudent } from "../../context/StudentContext";

// --- ICONS ---
const getDaysUntil = (dateStr: string) => {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
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
const LightBulbIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);
const BookIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);
const ShieldIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const MicIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);
const PrinterIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 9V4h12v5M6 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-1M6 14h12v8H6v-8z"
    />
  </svg>
);

export default function Dashboard() {
  const { isPrivacyMode } = usePrivacy();
  const { openAddModal } = useStudent();

  const [data, setData] = useState<DashboardStats>({
    student_count: 0,
    active_goals: 0,
    logs_this_week: 0,
    recent_logs: [],
  });
  const [upcomingIeps, setUpcomingIeps] = useState<
    { student: Student; days: number }[]
  >([]);
  const [teacherName, setTeacherName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, []);

  const loadDashboard = async () => {
    try {
      const stats = await dbService.getDashboardStats();
      setData(stats);

      const settings = await dbService.getSettings();
      if (settings?.teacher_name) {
        setTeacherName(settings.teacher_name);
      }

      const allStudents = await dbService.getStudents();
      const upcoming = allStudents
        .filter((s) => s.iep_date !== null)
        .map((s) => ({ student: s, days: getDaysUntil(s.iep_date!) }))
        .filter((item) => item.days <= 45)
        .sort((a, b) => a.days - b.days)
        .slice(0, 5);

      setUpcomingIeps(upcoming);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Loading Dashboard...</div>
      </div>
    );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-zinc-400">
            Welcome back{teacherName ? `, ${teacherName}.` : "."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-md font-medium transition-colors shadow-sm flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <span>+</span> New Student
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Students */}
        <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Total Students
              </p>
              <h3
                className={`text-2xl font-bold text-slate-900 dark:text-white ${
                  isPrivacyMode ? "privacy-blur" : ""
                }`}
              >
                {data.student_count}
              </h3>
            </div>
          </div>
        </div>

        {/* Active Goals */}
        <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Active Goals
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.active_goals}
              </h3>
            </div>
          </div>
        </div>

        {/* Logs This Week */}
        <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Logs This Week
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {data.logs_this_week}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COL: RECENT ACTIVITY + QUICK TIPS */}
        <div className="flex flex-col gap-8">
          <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {data.recent_logs.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No activity yet.
                </p>
              ) : (
                data.recent_logs.map((log, i) => (
                  <Link
                    key={i}
                    href={`/student/${log.student_id}/goal/${log.goal_id}`}
                    className="flex items-center justify-between p-3 rounded-lg border transition-colors bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:border-zinc-700"
                  >
                    <div>
                      <p
                        className={`font-semibold text-sm text-slate-900 dark:text-white ${
                          isPrivacyMode ? "privacy-blur" : ""
                        }`}
                      >
                        {log.student_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {log.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold text-indigo-600 dark:text-indigo-400 ${
                          isPrivacyMode ? "privacy-blur" : ""
                        }`}
                      >
                        {log.score}
                      </span>
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* REDESIGNED QUICK TIPS */}
          <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md dark:bg-amber-900/30 dark:text-amber-400">
                <LightBulbIcon />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Quick Tips
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Resources Tip */}
              <Link
                href="/library"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 group"
              >
                <div className="mt-1 text-indigo-500 group-hover:scale-110 transition-transform">
                  <BookIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                    Resources
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                    Customize goals & tools in the Resource Library.
                  </p>
                </div>
              </Link>

              {/* Privacy Tip */}
              <Link
                href="/settings"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 group"
              >
                <div className="mt-1 text-emerald-500 group-hover:scale-110 transition-transform">
                  <ShieldIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                    Privacy
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                    Data is local. Back up in Settings!
                  </p>
                </div>
              </Link>

              {/* Voice Tip (No link, just info) */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-transparent cursor-default">
                <div className="mt-1 text-red-500">
                  <MicIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                    Voice Note
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                    Tap the mic to dictate session notes.
                  </p>
                </div>
              </div>

              {/* Reports Tip */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-transparent cursor-default">
                <div className="mt-1 text-slate-500">
                  <PrinterIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                    Reports
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                    Print to PDF for instant progress reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: NEEDS ATTENTION & UPCOMING IEPS */}
        <div className="flex flex-col gap-8">
          <NeedsAttention />

          <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon /> Upcoming IEPs
            </h3>
            {upcomingIeps.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No IEPs due in the next 45 days.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingIeps.map((item, i) => {
                  let badgeColor =
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                  let badgeText = `${item.days} days`;
                  if (item.days < 0) {
                    badgeColor =
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    badgeText = `${Math.abs(item.days)} days overdue`;
                  } else if (item.days <= 7) {
                    badgeColor =
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                    badgeText = item.days === 0 ? "Today" : `${item.days} days`;
                  } else if (item.days <= 30) {
                    badgeColor =
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                  }
                  return (
                    <Link
                      key={i}
                      href={`/student/${item.student.id}`}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded transition-colors"
                    >
                      <span
                        className={`text-sm font-medium text-slate-700 dark:text-zinc-300 ${
                          isPrivacyMode ? "privacy-blur" : ""
                        }`}
                      >
                        {item.student.name}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}
                      >
                        {badgeText}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
