"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { dbService, Student } from "../utils/db";
import { usePrivacy } from "../context/PrivacyContext";
import { useToast } from "../context/ToastContext";
import BackupStatus from "./BackupStatus";

// --- ICONS ---

const LockIcon = () => (
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

// FIXED: Clean, simple Cog Icon
const SettingsIcon = () => (
  <svg
    className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const DashboardIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-5 h-5 mr-3 ${
      active ? "text-indigo-500" : "text-slate-400 dark:text-zinc-500"
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-4 h-4 absolute left-2.5 top-2 text-slate-400 dark:text-zinc-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export default function Sidebar() {
  const { lockApp, hasPin } = usePrivacy();
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, [pathname]);

  const fetchStudents = async () => {
    try {
      const data = await dbService.getStudents();
      if (Array.isArray(data)) setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLockClick = () => {
    if (hasPin) {
      lockApp();
    } else {
      toast.error("Set a PIN in Settings before locking.");
      router.push("/settings");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 flex flex-col h-screen fixed left-0 top-0 print:hidden z-50 border-r transition-colors duration-300 bg-white border-slate-200 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
      <Link
        href="/"
        className="block p-6 border-b transition-colors border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
      >
        <h1 className="text-xl font-bold tracking-wider text-slate-900 dark:text-white">
          GOAL MASTER
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
          IEP Tracking System
        </p>
      </Link>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-between">
        <div>
          {/* MAIN NAV */}
          <nav className="space-y-1 px-2 mb-6">
            <Link
              href="/"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                pathname === "/"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <DashboardIcon active={pathname === "/"} />
              Dashboard
            </Link>
          </nav>

          {/* STUDENT LIST HEADER */}
          <div className="px-4 mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Students
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-zinc-400">
              {filteredStudents.length}
            </span>
          </div>

          {/* SEARCH BAR */}
          <div className="px-2 mb-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 pl-8 text-sm rounded-md border outline-none transition-colors bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder-zinc-600 dark:focus:border-indigo-500"
              />
              <SearchIcon />
            </div>
          </div>

          {/* STUDENT LINKS */}
          <nav className="space-y-1 px-2">
            {students.length === 0 && (
              <p className="px-2 text-sm text-slate-400 italic">
                No students yet.
              </p>
            )}
            {students.length > 0 && filteredStudents.length === 0 && (
              <p className="px-2 text-sm text-slate-400 italic py-2 text-center">
                No results found.
              </p>
            )}
            {filteredStudents.map((student) => {
              const isActive = pathname.startsWith(`/student/${student.id}`);
              return (
                <Link
                  key={student.id}
                  href={`/student/${student.id}`}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold border transition-colors ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-slate-200 border-slate-300 text-slate-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div className="truncate">{student.name}</div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER AREA */}
        <div className="space-y-2">
          {/* Backup Status Widget */}
          <BackupStatus />

          <div className="px-2 pb-2 space-y-1 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={handleLockClick}
              className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <span className="w-5 h-5 mr-3 text-slate-400">
                <LockIcon />
              </span>{" "}
              Lock App
            </button>

            <Link
              href="/settings"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all 
                ${
                  pathname === "/settings"
                    ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
            >
              <SettingsIcon />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* NEW STUDENT BUTTON */}
      <div className="p-4 border-t transition-colors border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/?newStudent=true"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <span>+</span> <span>New Student</span>
        </Link>
      </div>
    </div>
  );
}
