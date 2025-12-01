"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../utils/db";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../ConfirmModal";

export default function ReportDefaultsSection() {
  const toast = useToast();
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    dbService.getSettings().then((s) => {
      if (s) {
        setTeacherName(s.teacher_name || "");
        setSchoolName(s.school_name || "");
      }
    });
  }, []);

  const confirmSave = async () => {
    try {
      await dbService.updateProfile(teacherName, schoolName);
      toast.success("Profile updated");
      setShowSaveModal(false);
    } catch (err) {
      toast.error("Failed to save profile");
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">
        Report Defaults
      </h2>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Teacher Name
          </label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="e.g. Ms. Frizzle"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
            School Name
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Walkerville Elementary"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
        >
          Save Defaults
        </button>
      </div>
      <ConfirmModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Update Defaults?"
        message="Apply changes to future reports?"
        confirmText="Save"
      />
    </section>
  );
}
