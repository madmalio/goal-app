"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dbService } from "../utils/db";
import { useToast } from "../context/ToastContext";
import { useStudent } from "../context/StudentContext";
import { APP_CONFIG } from "../config";
import UpgradeModal from "./UpgradeModal";

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

export default function AddStudentModal() {
  const toast = useToast();
  const router = useRouter();
  const { isAddModalOpen, closeAddModal, refreshStudents, students } =
    useStudent();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("K");
  const [classType, setClassType] = useState("General Ed");
  const [hasIepDate, setHasIepDate] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showPaywall, setShowPaywall] = useState(false);

  // CHECK LIMITS ON OPEN
  useEffect(() => {
    if (isAddModalOpen && APP_CONFIG.ENABLE_PAYWALL) {
      dbService.getLicenseStatus().then(({ license_status }) => {
        if (
          license_status !== "active" &&
          students.length >= APP_CONFIG.FREE_STUDENT_LIMIT
        ) {
          setShowPaywall(true);
        }
      });
    }
  }, [isAddModalOpen, students.length]);

  const resetForm = () => {
    setName("");
    setStudentId("");
    setGrade("K");
    setClassType("General Ed");
    setHasIepDate(true);
    setDate(new Date().toISOString().split("T")[0]);
    setShowPaywall(false);
  };

  const handleClose = () => {
    resetForm(); // Wipe data to prevent "flash" next time
    closeAddModal(); // Hide modal
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    handleClose(); // Close the form too since they can't use it
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showPaywall) return;

    try {
      const finalDate = hasIepDate ? date : null;
      const newStudent = await dbService.createStudent(
        name,
        studentId,
        grade,
        classType,
        finalDate
      );

      toast.success("Student added successfully");
      await refreshStudents();

      handleClose();

      if (newStudent && newStudent.id) {
        router.push(`/student/${newStudent.id}`);
      }
    } catch (err) {
      toast.error("Failed to add student");
    }
  };

  if (!isAddModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md rounded-xl shadow-2xl border p-6 animate-fade-in-up bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
            Add New Student
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                Student Name
              </label>
              <input
                autoFocus
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Student ID{" "}
                  <span className="text-slate-400 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Grade Level
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                Class / Support Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
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

            {/* TOGGLE IEP DATE */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Track IEP Date?
                </label>
                <input
                  type="checkbox"
                  checked={hasIepDate}
                  onChange={(e) => setHasIepDate(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
              {hasIepDate && (
                <div className="relative mt-2 animate-fade-in">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white border-slate-300 text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
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

      {/* PAYWALL MODAL (Renders on top if needed) */}
      <UpgradeModal isOpen={showPaywall} onClose={handlePaywallClose} />
    </>
  );
}
