"use client";

import { useState, useEffect } from "react";
import { findSmartGoals, GoalTemplate } from "../utils/goalLibrary";
import { dbService } from "../utils/db";

interface SmartGoalGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  studentName: string;
  grade: string;
  classType?: string;
  onSelectGoals: (goals: string[]) => void;
}

// Magic Wand Icon
const MagicWandIcon = () => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

export default function SmartGoalGenerator({
  isOpen,
  onClose,
  subject,
  studentName,
  grade,
  classType = "General Ed",
  onSelectGoals,
}: SmartGoalGeneratorProps) {
  const [allOptions, setAllOptions] = useState<GoalTemplate[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<GoalTemplate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAndSearch();
    }
  }, [isOpen, subject, classType, grade, studentName]);

  const loadAndSearch = async () => {
    try {
      // Fetch Custom Goals
      const customGoals = await dbService.getCustomGoalTemplates();
      // Run Logic
      const goals = findSmartGoals(
        subject || "Behavior",
        classType,
        grade,
        studentName,
        customGoals
      );

      setAllOptions(goals);
      setFilteredOptions(goals);
      setSearchQuery("");
      setSelectedIndices(new Set());
    } catch (err) {
      console.error("Failed to load library", err);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setFilteredOptions(allOptions);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredOptions(
        allOptions.filter(
          (opt) =>
            opt.text.toLowerCase().includes(q) ||
            opt.category.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, allOptions]);

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleConfirm = () => {
    const selectedTexts = Array.from(selectedIndices).map(
      (idx) => filteredOptions[idx].text
    );
    onSelectGoals(selectedTexts);
    onClose();
  };

  const handleRefresh = () => {
    loadAndSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              ✨ Goal Wizard
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {classType} • Grade {grade} •{" "}
              <span className="font-semibold text-indigo-600">{subject}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>

        <div className="relative border-b border-slate-100 dark:border-zinc-800">
          <input
            type="text"
            placeholder="Search specific skills..."
            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 text-sm focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <svg
            className="w-4 h-4 absolute left-3 top-3 text-slate-400"
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
        </div>

        <div className="p-2 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="space-y-2 p-2">
            {filteredOptions.map((opt, i) => {
              const isSelected = selectedIndices.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleSelection(i)}
                  className={`w-full text-left p-4 rounded-lg border transition-all group relative ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-500"
                      : "bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {opt.category}
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          isSelected
                            ? "text-indigo-900 dark:text-indigo-100"
                            : "text-slate-700 dark:text-zinc-200"
                        }`}
                      >
                        {opt.text}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-2">No matching goals found.</p>
                <p className="text-xs text-slate-400">
                  Try broadening your search.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-xl flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {selectedIndices.size} goal{selectedIndices.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIndices.size === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
