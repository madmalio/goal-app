"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivacy } from "../context/PrivacyContext";
import { useToast } from "../context/ToastContext";
import { useStudent } from "../context/StudentContext";
import InstallAppButton from "./InstallAppButton";

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
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);
const BookIcon = () => (
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
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
  const { students, openAddModal } = useStudent();

  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

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
      (student.student_id &&
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-64 flex flex-col h-screen fixed left-0 top-0 print:hidden z-50 border-r transition-colors duration-300 bg-white border-slate-200 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
      {/* 1. FIXED HEADER */}
      <div className="flex-none">
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

        {/* Dashboard Link */}
        <div className="px-2 py-4">
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
        </div>
      </div>

      {/* 2. SCROLLABLE STUDENT LIST (Flex-1 takes remaining space) */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Search & Count */}
        <div className="px-4 mb-2 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2">
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Students
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-zinc-400">
            {filteredStudents.length}
          </span>
        </div>

        <div className="px-2 mb-2 sticky top-8 bg-white dark:bg-zinc-900 z-10 pb-2">
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

        {/* The Actual List */}
        <nav className="space-y-1 px-2 pb-4">
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
            const isActive =
              pathname === `/student/${student.id}` ||
              pathname.startsWith(`/student/${student.id}/`);

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
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold border transition-colors shrink-0 ${
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

      {/* 3. FIXED FOOTER (Always visible) */}
      <div className="flex-none border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
        {/* Admin Links */}
        <div className="px-2 pt-2 space-y-1">
          {/* Install Button (Auto-hides) */}
          <div className="px-2">
            <InstallAppButton />
          </div>

          <button
            onClick={handleLockClick}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <span className="w-5 h-5 mr-3 text-slate-400">
              <LockIcon />
            </span>
            Lock App
          </button>

          <Link
            href="/library"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
              pathname === "/library"
                ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <BookIcon />
            Resources
          </Link>

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

        {/* New Student Button */}
        <div className="p-4">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <span>+</span> <span>New Student</span>
          </button>
        </div>
      </div>
    </div>
  );
}
