"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation"; // <--- 1. Import Hook
import { dbService, CustomGoalTemplate, Manipulative } from "../../../utils/db";
import { useToast } from "../../../context/ToastContext";
import ConfirmModal from "../../../components/ConfirmModal";

// ... (Icons: PlusIcon, SearchIcon, TrashIcon, EditIcon - keep as is) ...
const PlusIcon = () => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-slate-400"
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
const TrashIcon = () => (
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
);
const EditIcon = () => (
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
);

export default function LibraryPage() {
  const searchParams = useSearchParams(); // <--- 2. Get Search Params
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"goals" | "tools">("goals");

  // -- GOAL STATE --
  const [goals, setGoals] = useState<CustomGoalTemplate[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<CustomGoalTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);
  const [goalSubject, setGoalSubject] = useState("");
  const [goalText, setGoalText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // -- MANIPULATIVE STATE --
  const [tools, setTools] = useState<Manipulative[]>([]);
  const [newTool, setNewTool] = useState("");

  // 3. SYNC TAB ON LOAD
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "tools") {
      setActiveTab("tools");
    } else {
      setActiveTab("goals"); // Optional: Reset to default
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gData = await dbService.getCustomGoalTemplates();
      setGoals(gData);
      const tData = await dbService.getManipulatives();
      setTools(tData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setFilteredGoals(goals);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredGoals(
        goals.filter(
          (g) =>
            g.subject.toLowerCase().includes(q) ||
            g.text.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, goals]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoalId) {
        await dbService.updateCustomGoalTemplate(
          editingGoalId,
          goalSubject,
          goalText
        );
        toast.success("Template updated");
      } else {
        await dbService.createCustomGoalTemplate(goalSubject, goalText);
        toast.success("Template created");
      }
      setIsGoalModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;
    try {
      await dbService.deleteCustomGoalTemplate(deleteGoalId);
      toast.success("Template deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete");
    }
    setDeleteGoalId(null);
  };

  const openGoalModal = (goal?: CustomGoalTemplate) => {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalSubject(goal.subject);
      setGoalText(goal.text);
    } else {
      setEditingGoalId(null);
      setGoalSubject("");
      setGoalText("");
    }
    setIsGoalModalOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText =
      goalText.substring(0, start) + placeholder + goalText.substring(end);
    setGoalText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + placeholder.length,
        start + placeholder.length
      );
    }, 0);
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.trim()) return;
    try {
      await dbService.addManipulative(newTool);
      setNewTool("");
      loadData();
      toast.success("Tool added");
    } catch (e) {
      toast.error("Failed to add tool");
    }
  };

  const handleDeleteTool = async (id: number) => {
    try {
      await dbService.deleteManipulative(id);
      loadData();
      toast.success("Tool removed");
    } catch (e) {
      toast.error("Failed to remove tool");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Resource Library
      </h1>

      <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6">
        <button
          onClick={() => setActiveTab("goals")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "goals"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400"
          }`}
        >
          Goal Templates
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "tools"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400"
          }`}
        >
          Manipulatives & Tools
        </button>
      </div>

      {activeTab === "goals" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="absolute left-3 top-2.5">
                <SearchIcon />
              </div>
            </div>
            <button
              onClick={() => openGoalModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PlusIcon /> Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400 italic">
                No templates found.
              </div>
            ) : (
              filteredGoals.map((g) => (
                <div
                  key={g.id}
                  className="group p-5 rounded-xl border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded dark:bg-zinc-800 dark:text-zinc-300">
                      {g.subject}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openGoalModal(g)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(g.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {g.text.split("{{name}}").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="bg-indigo-50 text-indigo-600 px-1 rounded text-xs font-bold dark:bg-indigo-900/30 dark:text-indigo-300">
                            NAME
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="animate-fade-in max-w-2xl">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2 dark:text-white">
              Custom Manipulatives
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              These items appear in your tracking form dropdown.
            </p>
            <form onSubmit={handleAddTool} className="flex gap-3 mb-6">
              <input
                type="text"
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="e.g. Fidget Spinner, Timer, iPad"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {tools.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full text-sm font-medium border border-slate-200 dark:border-zinc-700"
                >
                  {m.label}
                  <button
                    onClick={() => handleDeleteTool(m.id)}
                    className="text-slate-400 hover:text-red-500 rounded-full p-0.5 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              {editingGoalId ? "Edit Template" : "New Template"}
            </h2>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
                  Subject
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="e.g. Reading, Behavior"
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium dark:text-zinc-300">
                    Goal Text
                  </label>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder("{{name}}")}
                    className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 transition-colors"
                  >
                    + Insert Name
                  </button>
                </div>
                <textarea
                  ref={textAreaRef}
                  required
                  rows={4}
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Template?"
        message="Are you sure? This cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
