"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchFromAPI } from "../../utils/api";
import { usePrivacy } from "../../context/PrivacyContext";

export default function Dashboard() {
  const { isPrivacyMode } = usePrivacy();
  const [data, setData] = useState({
    student_count: 0,
    active_goals: 0,
    logs_this_week: 0,
    recent_logs: [] as any[],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (searchParams.get("newStudent") === "true") {
      setIsModalOpen(true);
      router.replace("/");
    }
  }, [searchParams, router]);

  const loadDashboard = async () => {
    try {
      const statsData = await fetchFromAPI("/stats");
      setData(statsData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchFromAPI("/students", {
        method: "POST",
        body: JSON.stringify({
          name: newStudentName,
          student_id: newStudentId,
        }),
      });
      setIsModalOpen(false);
      setNewStudentName("");
      setNewStudentId("");
      loadDashboard();
      window.location.reload();
    } catch (err) {
      alert("Failed to add student");
    }
  };

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
          <span>+</span> Add New Student
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {/* PRIVACY BLUR APPLIED */}
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
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
        {/* Recent Activity Feed */}
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
                    {/* PRIVACY BLUR ON NAMES */}
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
                    {/* PRIVACY BLUR ON SCORES */}
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

        <div className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 h-fit">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            Quick Tips
          </h3>
          <ul className="list-disc list-inside text-slate-600 dark:text-zinc-400 space-y-3 text-sm">
            <li>Use the Sidebar to navigate between students.</li>
            <li>
              Click <strong>+ New Student</strong> to add a profile.
            </li>
            <li>Go to a student's profile to add goals and track progress.</li>
            <li>
              Use <strong>Settings</strong> to backup your database regularly.
            </li>
          </ul>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
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
