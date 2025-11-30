"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dbService, DashboardStats, Student } from "../../utils/db";
import { usePrivacy } from "../../context/PrivacyContext";
import { useToast } from "../../context/ToastContext";

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {" "}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />{" "}
  </svg>
);

// Helper to calculate days remaining
const getDaysUntil = (dateStr: string) => {
  const target = new Date(dateStr);
  const now = new Date();
  // Reset hours to compare dates only
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function Dashboard() {
  const { isPrivacyMode } = usePrivacy();
  const toast = useToast();

  const [data, setData] = useState<DashboardStats>({
    student_count: 0,
    active_goals: 0,
    logs_this_week: 0,
    recent_logs: [],
  });
  const [upcomingIeps, setUpcomingIeps] = useState<
    { student: Student; days: number }[]
  >([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("K");
  const [newStudentClassType, setNewStudentClassType] = useState("General Ed");
  const [newStudentDate, setNewStudentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("newStudent") === "true") {
      setIsModalOpen(true);
      router.replace("/");
    }
  }, [searchParams, router]);

  const loadDashboard = async () => {
    try {
      const stats = await dbService.getDashboardStats();
      setData(stats);

      // NEW: Load and calculate IEP dates
      const allStudents = await dbService.getStudents(); // Fetch all active students
      const upcoming = allStudents
        .map((s) => ({ student: s, days: getDaysUntil(s.iep_date) }))
        // Filter: Show Overdue (negative) OR Upcoming within 45 days
        .filter((item) => item.days <= 45)
        .sort((a, b) => a.days - b.days) // Sort soonest first
        .slice(0, 5); // Limit to top 5

      setUpcomingIeps(upcoming);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.createStudent(
        newStudentName,
        newStudentId,
        newStudentGrade,
        newStudentClassType,
        newStudentDate
      );
      toast.success("Student added successfully");
      setIsModalOpen(false);
      setNewStudentName("");
      setNewStudentId("");
      setNewStudentGrade("K");
      setNewStudentClassType("General Ed");
      setNewStudentDate(new Date().toISOString().split("T")[0]);
      await loadDashboard();
      window.location.reload();
    } catch (err) {
      toast.error("Failed to add student");
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-zinc-400">Welcome back.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-md font-medium transition-colors shadow-sm flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <span>+</span> New Student
        </button>
      </div>

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Students Card */}
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

        {/* Goals Card */}
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

        {/* Logs Card */}
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
        {/* RECENT ACTIVITY */}
        <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {data.recent_logs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No activity yet.</p>
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

        <div className="flex flex-col gap-8">
          {/* NEW: UPCOMING IEPS WIDGET */}
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

          {/* QUICK TIPS */}
          <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 h-fit">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
              Quick Tips
            </h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-zinc-400 space-y-3 text-sm">
              <li>Use the Sidebar to navigate between students.</li>
              <li>
                Click <strong>+ New Student</strong> to add a profile.
              </li>
              <li>
                Go to a student's profile to add goals and track progress.
              </li>
              <li>
                Use <strong>Settings</strong> to backup your database regularly.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl shadow-2xl border p-6 animate-fade-in-up bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Add New Student
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Student Name
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    Grade Level
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                  >
                    {[
                      "PK",
                      "K",
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "10",
                      "11",
                      "12",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* NEW: CLASS TYPE */}
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Class / Support Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  value={newStudentClassType}
                  onChange={(e) => setNewStudentClassType(e.target.value)}
                >
                  <option value="General Ed">General Education</option>
                  <option value="Resource">Resource / Inclusion</option>
                  <option value="SES1">SES1 (Social/Behavioral)</option>
                  <option value="SES2">SES2 (Significant Support)</option>
                  <option value="SES3">SES3 (Intensive Support)</option>
                  <option value="Speech">Speech / SLP</option>
                  <option value="OT">Occupational Therapy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  IEP Date
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                    value={newStudentDate}
                    onChange={(e) => setNewStudentDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-md font-medium transition-colors shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-md font-medium text-white transition-colors shadow-sm bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
