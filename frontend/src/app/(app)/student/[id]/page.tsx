"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { dbService, Student, Goal } from "../../../../utils/db";
import { findSmartGoals } from "../../../../utils/goalLibrary";
import ConfirmModal from "../../../../components/ConfirmModal";
import { useToast } from "../../../../context/ToastContext";
import SmartGoalGenerator from "../../../../components/SmartGoalGenerator";
import Link from "next/link";

// --- ICONS ---
const MagicIcon = () => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
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
const StopIcon = () => (
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
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 10a1 1 0 011-1h4a1 1 0 01-1-1v-4z"
    />
  </svg>
);
const ChevronDownIcon = () => (
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
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export default function StudentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const studentId = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);
  const [showSmartGenerator, setShowSmartGenerator] = useState(false);

  // Goal Form State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [masteryEnabled, setMasteryEnabled] = useState(false);
  const [masteryScore, setMasteryScore] = useState(80);
  const [masteryCount, setMasteryCount] = useState(3);
  const [frequency, setFrequency] = useState("Weekly");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [trackingType, setTrackingType] = useState<"fraction" | "percentage">(
    "fraction"
  );

  // Edit Student Form State
  const [editName, setEditName] = useState("");
  const [editId, setEditId] = useState("");
  const [editGrade, setEditGrade] = useState("K");
  const [editClassType, setEditClassType] = useState("General Ed");
  const [editDate, setEditDate] = useState("");
  const [hasIepDate, setHasIepDate] = useState(true); // <--- NEW TOGGLE

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const allStudents = await dbService.getStudents(true);
      const found = allStudents.find((s) => s.id === studentId);
      if (found) {
        setStudent(found);
        setEditName(found.name);
        setEditId(found.student_id || "");
        setEditGrade(found.grade || "K");
        setEditClassType(found.class_type || "General Ed");

        // Handle Null Date
        if (found.iep_date) {
          setHasIepDate(true);
          setEditDate(new Date(found.iep_date).toISOString().split("T")[0]);
        } else {
          setHasIepDate(false);
          setEditDate(new Date().toISOString().split("T")[0]);
        }
      } else {
        toast.error("Student not found");
      }
      const goalData = await dbService.getGoals(studentId);
      setGoals(goalData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const finalDate = hasIepDate ? editDate : null;
    await dbService.updateStudent(
      student.id,
      editName,
      editId,
      editGrade,
      editClassType,
      finalDate,
      student.active
    );
    setIsEditingStudent(false);
    loadData();
    toast.success("Student updated");
  };

  const handleArchive = async () => {
    if (!student) return;
    await dbService.updateStudent(
      student.id,
      student.name,
      student.student_id || "",
      student.grade,
      student.class_type,
      student.iep_date,
      false
    );
    toast.success("Student archived");
    router.push("/");
  };

  const handleDelete = async () => {
    if (!student) return;
    await dbService.deleteStudent(student.id);
    toast.success("Student deleted");
    router.push("/");
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: studentId,
        subject,
        description,
        mastery_enabled: masteryEnabled,
        mastery_score: Number(masteryScore),
        mastery_count: Number(masteryCount),
        frequency,
        tracking_type: trackingType,
      };
      if (editingGoalId) {
        await dbService.updateGoal(editingGoalId, payload);
        toast.success("Goal updated");
      } else {
        await dbService.createGoal(payload);
        toast.success("Goal created");

        if (saveToLibrary && description && subject) {
          const firstName = student?.name.split(" ")[0] || "";
          const regex = new RegExp(firstName, "gi");
          const template = description.replace(regex, "{{name}}");
          await dbService.createCustomGoalTemplate(subject, template);
          toast.success("Saved to your Goal Library!");
        }
      }

      setIsAddingGoal(false);
      setEditingGoalId(null);
      setSubject("");
      setDescription("");
      setMasteryEnabled(false);
      setMasteryScore(80);
      setMasteryCount(3);
      setFrequency("Weekly");
      setTrackingType("fraction");
      setSaveToLibrary(false);
      loadData();
    } catch (err) {
      toast.error("Failed to save goal");
    }
  };

  const handleGenerateGoal = async () => {
    if (!subject) {
      toast.error("Please enter a Subject first.");
      return;
    }
    if (!student) return;

    const customGoals = await dbService.getCustomGoalTemplates();
    const suggestions = findSmartGoals(
      subject,
      student.class_type || "General Ed",
      student.grade || "K",
      student.name,
      customGoals
    );
    if (suggestions.length > 0) {
      const randomGoal = suggestions[0];
      setDescription(randomGoal.text);
      toast.success("Suggestion applied! Click 'Goal Wizard' for more.");
    } else {
      toast.info("No matches found. Try the Wizard!");
    }
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser does not support voice.");
      return;
    }
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setDescription((prev) => (prev + " " + transcript).trim());
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleEditGoalClick = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setSubject(goal.subject);
    setDescription(goal.description);
    setMasteryEnabled(goal.mastery_enabled);
    setMasteryScore(goal.mastery_score);
    setMasteryCount(goal.mastery_count);
    setFrequency(goal.frequency);
    setTrackingType(
      (goal.tracking_type as "fraction" | "percentage") || "fraction"
    );
    setIsAddingGoal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    await dbService.deleteGoal(goalToDelete);
    setGoalToDelete(null);
    loadData();
    toast.success("Goal deleted");
  };

  if (!student)
    return <div className="text-slate-500 p-8">Loading student...</div>;

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
            {student.student_id ? `ID: ${student.student_id} • ` : ""}
            {student.grade} / {student.class_type}
            {student.iep_date &&
              ` • IEP Date: ${new Date(student.iep_date).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="group p-2 rounded-md transition-colors border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800"
            title="Archive"
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
            title="Delete"
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
              setDescription("");
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${
              isAddingGoal
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isAddingGoal ? "Cancel" : <span>+ New Goal</span>}
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
                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
                    Student ID{" "}
                    <span className="text-slate-400 font-normal text-xs">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editId}
                    onChange={(e) => setEditId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
                    Grade
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-md border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
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
                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
                  Class Type
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                  value={editClassType}
                  onChange={(e) => setEditClassType(e.target.value)}
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

              {/* DATE TOGGLE */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-800">
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
                  <div className="relative mt-2">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <CalendarIcon />
                    </div>
                    <input
                      type="date"
                      required
                      className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                  </div>
                )}
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
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Math, Behavior"
                  className="flex-1 px-3 py-2 border rounded-md bg-slate-50 dark:bg-zinc-950 dark:border-zinc-700"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!subject) {
                      toast.error("Enter a subject first");
                      return;
                    }
                    setShowSmartGenerator(true);
                  }}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1 font-medium"
                >
                  <MagicIcon />
                  <span className="text-sm">Goal Wizard</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-md border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={masteryEnabled}
                  onChange={(e) => setMasteryEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label className="text-sm font-bold">
                  Track Mastery Criteria?
                </label>
              </div>
              {masteryEnabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold">Target %</label>
                    <input
                      type="number"
                      value={masteryScore}
                      onChange={(e) => setMasteryScore(Number(e.target.value))}
                      className="w-full p-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold">Sessions</label>
                    <input
                      type="number"
                      value={masteryCount}
                      onChange={(e) => setMasteryCount(Number(e.target.value))}
                      className="w-full p-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                </div>
              )}
              {!masteryEnabled && (
                <div className="relative">
                  <label className="block text-xs uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer appearance-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <div className="absolute right-3 top-8 pointer-events-none text-slate-400">
                    <ChevronDownIcon />
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                className="w-full p-3 border rounded-md dark:bg-zinc-950 dark:border-zinc-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={handleGenerateGoal}
                  className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  title="Shuffle Suggestion"
                >
                  <MagicIcon />
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full ${
                    isListening
                      ? "bg-red-100 text-red-600"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isListening ? <StopIcon /> : <MicIcon />}
                </button>
              </div>
            </div>

            {!editingGoalId && (
              <div className="flex items-center gap-2 pt-2 pb-4">
                <input
                  type="checkbox"
                  id="saveLib"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="saveLib"
                  className="text-sm text-slate-600 dark:text-zinc-400 cursor-pointer select-none"
                >
                  Save this goal to my Library for future students
                </label>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-6 rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 relative group"
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditGoalClick(goal)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-slate-400 hover:text-indigo-500"
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-slate-400 hover:text-red-500"
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
              <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 ml-2">
                {goal.frequency}
              </span>
            </div>
            <p className="text-lg leading-snug text-slate-800 dark:text-zinc-200 mt-2">
              {goal.description}
            </p>
            {goal.mastery_enabled && (
              <div className="mt-3 text-xs text-slate-400 flex gap-4">
                <span>
                  Target: <strong>{goal.mastery_score}%</strong>
                </span>
                <span>
                  Duration: <strong>{goal.mastery_count} sessions</strong>
                </span>
              </div>
            )}
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
        ))}
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchive}
        title="Archive?"
        message="Archive this student?"
        confirmText="Archive"
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete?"
        message="Delete permanently?"
        confirmText="Delete"
        isDestructive
      />
      <ConfirmModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal?"
        message="Delete goal and logs?"
        confirmText="Delete"
        isDestructive
      />
      <SmartGoalGenerator
        isOpen={showSmartGenerator}
        onClose={() => setShowSmartGenerator(false)}
        subject={subject}
        studentName={student.name}
        classType={student.class_type}
        grade={student.grade}
        onSelectGoals={(selectedGoals) => {
          const text = selectedGoals.join("\n\n");
          setDescription((prev) => (prev ? prev + "\n\n" + text : text));
        }}
      />
    </div>
  );
}
