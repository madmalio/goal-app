"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchFromAPI } from "../../../../utils/api";
import ConfirmModal from "../../../../components/ConfirmModal";

interface Goal {
  id: number;
  subject: string;
  iep_date: string;
  description: string;
  mastery_score: number;
  mastery_count: number;
}

interface Student {
  id: number;
  name: string;
  student_id: string;
  active: boolean;
}

// --- ICONS ---
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

export default function StudentPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id;

  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

  const [subject, setSubject] = useState("");
  const [iepDate, setIepDate] = useState("");
  const [description, setDescription] = useState("");

  // New Fields
  const [masteryScore, setMasteryScore] = useState(80);
  const [masteryCount, setMasteryCount] = useState(3);

  const [editName, setEditName] = useState("");
  const [editId, setEditId] = useState("");

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const allStudents = await fetchFromAPI("/students");
      const found = allStudents.find(
        (s: Student) => s.id === Number(studentId)
      );
      if (found) {
        setStudent(found);
        setEditName(found.name);
        setEditId(found.student_id);
      }
      const goalData = await fetchFromAPI(`/goals?student_id=${studentId}`);
      setGoals(goalData);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      await fetchFromAPI(`/students/${student.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          student_id: editId,
          active: student.active,
        }),
      });
      setIsEditingStudent(false);
      loadData();
      window.location.reload();
    } catch (err) {
      alert("Failed to update student");
    }
  };

  const handleArchive = async () => {
    if (!student) return;
    try {
      await fetchFromAPI(`/students/${student.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: student.name,
          student_id: student.student_id,
          active: false,
        }),
      });
      window.location.href = "/";
    } catch (err) {
      alert("Failed to archive student");
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    try {
      await fetchFromAPI(`/students/${student.id}`, { method: "DELETE" });
      window.location.href = "/";
    } catch (err) {
      alert("Failed to delete student");
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: Number(studentId),
        subject,
        iep_date: iepDate,
        description,
        mastery_score: Number(masteryScore),
        mastery_count: Number(masteryCount),
      };

      if (editingGoalId) {
        await fetchFromAPI(`/goals/${editingGoalId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchFromAPI("/goals", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsAddingGoal(false);
      setEditingGoalId(null);
      setSubject("");
      setIepDate("");
      setDescription("");
      setMasteryScore(80);
      setMasteryCount(3);
      loadData();
    } catch (err) {
      alert("Failed to save goal");
    }
  };

  const handleEditGoalClick = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setSubject(goal.subject);
    setIepDate(goal.iep_date.split("T")[0]);
    setDescription(goal.description);
    setMasteryScore(goal.mastery_score);
    setMasteryCount(goal.mastery_count);
    setIsAddingGoal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await fetchFromAPI(`/goals/${goalToDelete}`, { method: "DELETE" });
      setGoalToDelete(null);
      loadData();
    } catch (err) {
      alert("Failed to delete goal");
    }
  };

  if (!student)
    return (
      <div className="text-slate-500 dark:text-zinc-500 p-8">
        Loading student...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {student.name}
            </h1>
            <button
              onClick={() => setIsEditingStudent(true)}
              className="text-slate-400 hover:text-indigo-500 transition-colors"
            >
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            ID: {student.student_id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="group p-2 rounded-md transition-colors border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800"
          >
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="group p-2 rounded-md transition-colors border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:text-red-500/70 dark:hover:bg-red-900/20"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={() => {
              setIsAddingGoal(!isAddingGoal);
              setEditingGoalId(null);
              setSubject("");
              setIepDate("");
              setDescription("");
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${
              isAddingGoal
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isAddingGoal ? (
              "Cancel"
            ) : (
              <>
                <span>+</span> New Goal
              </>
            )}
          </button>
        </div>
      </div>

      {isEditingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Edit Student
            </h2>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={editId}
                  onChange={(e) => setEditId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-slate-50 border-slate-300 text-slate-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(false)}
                  className="flex-1 py-2 rounded-md bg-slate-100 dark:bg-zinc-800 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-md bg-indigo-600 text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="p-6 rounded-xl border shadow-sm bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 animate-fade-in-down">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            {editingGoalId ? "Edit Goal" : "Add IEP Goal"}
          </h3>
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Math"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  IEP Date
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarIcon />
                  </div>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                    value={iepDate}
                    onChange={(e) => setIepDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
              </div>
            </div>
            {/* MASTERY CRITERIA INPUTS */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-md border border-slate-200 dark:border-zinc-800">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1">
                  Mastery Target (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={masteryScore}
                  onChange={(e) => setMasteryScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1">
                  Consecutive Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={masteryCount}
                  onChange={(e) => setMasteryCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Goal Description
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                {editingGoalId ? "Update Goal" : "Save Goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {goals.length === 0 ? (
          <p className="text-slate-500 dark:text-zinc-600 italic">
            No goals found. Add one above.
          </p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="p-6 rounded-xl border shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 relative group"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditGoalClick(goal)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-indigo-500 transition-colors"
                >
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setGoalToDelete(goal.id)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex justify-between items-start mb-2 pr-16">
                <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {goal.subject}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  IEP Date:{" "}
                  {new Date(goal.iep_date).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })}
                </span>
              </div>
              <p className="text-lg leading-snug text-slate-800 dark:text-zinc-200">
                {goal.description}
              </p>
              {/* MASTERY BADGE PREVIEW (Optional) */}
              <div className="mt-3 text-xs text-slate-400 flex gap-4">
                <span>
                  Target: <strong>{goal.mastery_score}%</strong>
                </span>
                <span>
                  Duration: <strong>{goal.mastery_count} sessions</strong>
                </span>
              </div>
              <Link
                href={`/student/${studentId}/goal/${goal.id}`}
                className="mt-4 pt-4 border-t flex justify-end block border-slate-100 dark:border-zinc-800"
              >
                <span className="text-sm font-medium flex items-center transition-colors text-slate-500 group-hover:text-indigo-600 dark:text-zinc-500 dark:group-hover:text-indigo-400">
                  Track Progress{" "}
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchive}
        title="Archive Student?"
        message={`Are you sure you want to archive ${student.name}?`}
        confirmText="Archive"
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Permanently Delete?"
        message="WARNING: This will delete the student and ALL their data."
        confirmText="Delete Forever"
        isDestructive={true}
      />
      <ConfirmModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal?"
        message="This will delete this goal and ALL its logs."
        confirmText="Delete Goal"
        isDestructive={true}
      />
    </div>
  );
}
