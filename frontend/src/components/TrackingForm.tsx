"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TrackingLog, dbService, Manipulative } from "../utils/db";
import { useToast } from "../context/ToastContext";
import { APP_CONFIG } from "../config"; // <--- 1. Import Config
import UpgradeModal from "./UpgradeModal"; // <--- 1. Import Modal

// --- ICONS ---
const ToggleBtn = ({ label, selected, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-md text-sm font-semibold transition-all border shadow-sm ${
      selected
        ? "bg-indigo-600 border-indigo-600 text-white ring-1 ring-indigo-400"
        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`}
  >
    {label}
  </button>
);
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

interface TrackingFormProps {
  studentName: string;
  goalId: number;
  initialData?: TrackingLog | null;
  defaultScoreType?: "fraction" | "percentage";
  onSubmit: (data: Partial<TrackingLog>) => Promise<void>;
  onCancel: () => void;
  onPreferenceUpdate?: (type: "fraction" | "percentage") => void;
}

export default function TrackingForm({
  studentName,
  goalId,
  initialData,
  defaultScoreType = "fraction",
  onSubmit,
  onCancel,
  onPreferenceUpdate,
}: TrackingFormProps) {
  const toast = useToast();

  const [manipulativesList, setManipulativesList] = useState<Manipulative[]>(
    []
  );
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [timeSpent, setTimeSpent] = useState("");
  const [scoreType, setScoreType] = useState<"fraction" | "percentage">(
    defaultScoreType
  );
  const [scoreNum, setScoreNum] = useState("");
  const [scoreDenom, setScoreDenom] = useState("");
  const [scorePercent, setScorePercent] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [compliance, setCompliance] = useState("");
  const [behavior, setBehavior] = useState("");
  const [hasManipulatives, setHasManipulatives] = useState(false);
  const [manipulativesType, setManipulativesType] = useState("");
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // NEW: Paywall State
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    dbService.getManipulatives().then(setManipulativesList);
  }, []);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.log_date);
      if (initialData.score && initialData.score.includes("/")) {
        setScoreType("fraction");
        const [n, d] = initialData.score.split("/");
        setScoreNum(n);
        setScoreDenom(d);
        setScorePercent("");
      } else if (initialData.score) {
        setScoreType("percentage");
        setScorePercent(initialData.score.replace("%", "") || "");
        setScoreNum("");
        setScoreDenom("");
      }
      setTimeSpent(initialData.time_spent || "");
      setPrompts(
        initialData.prompt_level ? initialData.prompt_level.split(", ") : []
      );
      setCompliance(initialData.compliance || "");
      setBehavior(initialData.behavior || "");
      setHasManipulatives(initialData.manipulatives_used || false);
      setManipulativesType(initialData.manipulatives_type || "");
      setNotes(initialData.notes || "");
    } else {
      resetForm();
    }
  }, [initialData, defaultScoreType]);

  useEffect(() => {
    if (!initialData) {
      setScoreType(defaultScoreType);
    }
  }, [defaultScoreType, initialData]);

  const resetForm = () => {
    setScoreType(defaultScoreType);
    setScoreNum("");
    setScoreDenom("");
    setScorePercent("");
    setTimeSpent("");
    setPrompts([]);
    setCompliance("");
    setBehavior("");
    setHasManipulatives(false);
    setManipulativesType("");
    setNotes("");
    setDate(new Date().toLocaleDateString("en-CA"));
  };

  // --- 2. HELPER: Check Paywall ---
  const checkPaywall = async () => {
    if (APP_CONFIG.ENABLE_PAYWALL) {
      const { license_status } = await dbService.getLicenseStatus();
      if (license_status !== "active") {
        setShowPaywall(true);
        return true; // Blocked
      }
    }
    return false; // Allowed
  };

  const togglePrompt = (p: string) => {
    setPrompts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerateNarrative = async () => {
    // --- BLOCK MAGIC ---
    if (await checkPaywall()) return;

    const parts: string[] = [];
    const firstName = studentName ? studentName.split(" ")[0] : "The student";
    if (compliance && behavior)
      parts.push(
        `${firstName} was ${compliance.toLowerCase()} compliant and demonstrated ${behavior.toLowerCase()} behavior.`
      );
    else if (compliance)
      parts.push(`${firstName} was ${compliance.toLowerCase()} compliant.`);
    else if (behavior)
      parts.push(
        `${firstName} demonstrated ${behavior.toLowerCase()} behavior.`
      );

    if (scoreType === "fraction" && scoreNum && scoreDenom) {
      parts.push(`They achieved a score of ${scoreNum}/${scoreDenom}`);
    } else if (scoreType === "percentage" && scorePercent) {
      parts.push(`They achieved ${scorePercent}% accuracy`);
    }

    if (prompts.length > 0) {
      const expand: Record<string, string> = {
        HOH: "Hand-over-Hand",
        VIP: "Visual Prompts",
        VP: "Verbal Prompts",
        IND: "Independence",
      };
      const pText = prompts.map((p) => expand[p] || p).join(" and ");
      if (parts.length > 0 && (scoreNum || scorePercent))
        parts[parts.length - 1] += ` with ${pText}.`;
      else parts.push(`Task completed with ${pText}.`);
    } else {
      if (parts.length > 0 && (scoreNum || scorePercent))
        parts[parts.length - 1] += ".";
    }

    if (hasManipulatives)
      parts.push(
        `Manipulatives${
          manipulativesType ? ` (${manipulativesType})` : ""
        } were utilized.`
      );
    if (timeSpent) parts.push(`Duration: ${timeSpent}.`);

    if (parts.length === 0) {
      toast.error("Fill in some data first.");
      return;
    }
    const narrative = parts.join(" ");
    setNotes((prev) => (prev ? prev + "\n" + narrative : narrative));
    toast.success("Narrative generated!");
  };

  const toggleListening = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser does not support voice.");
      return;
    }

    // --- BLOCK VOICE ---
    if (await checkPaywall()) return;

    if (isListening) {
      recognitionRef.current?.stop();
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
        setNotes((prev) => (prev + " " + transcript).trim());
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData && scoreType !== defaultScoreType && onPreferenceUpdate) {
      onPreferenceUpdate(scoreType);
    }
    let finalScore = "";
    if (scoreType === "fraction") {
      finalScore =
        scoreNum && scoreDenom ? `${scoreNum}/${scoreDenom}` : scoreNum;
    } else {
      finalScore = scorePercent ? `${scorePercent}%` : "";
    }
    const finalPrompts = prompts.join(", ");
    await onSubmit({
      goal_id: goalId,
      log_date: date,
      score: finalScore,
      time_spent: timeSpent,
      prompt_level: finalPrompts,
      compliance,
      behavior,
      manipulatives_used: hasManipulatives,
      manipulatives_type: hasManipulatives ? manipulativesType : "",
      notes,
    });
    if (!initialData) resetForm();
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className={`border p-6 rounded-xl space-y-6 shadow-sm transition-colors bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 ${
          initialData ? "border-indigo-500/50" : ""
        }`}
      >
        {initialData && (
          <div className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 px-3 py-2 rounded text-sm font-bold flex justify-between items-center">
            <span>EDITING MODE</span>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
              Date
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <CalendarIcon />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker()
                }
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
              Time Spent
            </label>
            <input
              type="text"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="e.g. 15 min"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* SCORE SECTION */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700">
          <label className="block text-sm font-bold mb-3 dark:text-zinc-300 text-center">
            Data Collection Mode
          </label>
          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-md border border-slate-200 dark:border-zinc-700 mb-4">
            <button
              type="button"
              onClick={() => setScoreType("fraction")}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                scoreType === "fraction"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-500"
              }`}
            >
              Count (x/y)
            </button>
            <button
              type="button"
              onClick={() => setScoreType("percentage")}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                scoreType === "percentage"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-500"
              }`}
            >
              Percentage (%)
            </button>
          </div>
          {scoreType === "fraction" ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 text-center">
                  Correct
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={scoreNum}
                  onChange={(e) => setScoreNum(e.target.value)}
                  placeholder="8"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center text-lg"
                />
              </div>
              <span className="text-slate-400 font-bold text-2xl mt-4">/</span>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 text-center">
                  Total
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={scoreDenom}
                  onChange={(e) => setScoreDenom(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center text-lg"
                />
              </div>
            </div>
          ) : (
            <div className="relative max-w-[150px] mx-auto">
              <label className="block text-xs font-medium text-slate-500 mb-1 text-center">
                Accuracy
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={scorePercent}
                onChange={(e) => setScorePercent(e.target.value)}
                placeholder="80"
                className="w-full pl-4 pr-8 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center text-lg"
              />
              <span className="absolute right-4 top-8 text-slate-400 font-bold">
                %
              </span>
            </div>
          )}
        </div>

        {/* Prompts Section */}
        <div>
          <label className="block text-sm font-medium mb-2 dark:text-zinc-300">
            Prompts Used
          </label>
          <div className="flex gap-2">
            {["HOH", "VIP", "VP", "Independent"].map((p) => (
              <ToggleBtn
                key={p}
                label={p}
                selected={prompts.includes(p)}
                onClick={() => togglePrompt(p)}
              />
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-md p-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                HOH
              </span>{" "}
              Hand over Hand
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                VIP
              </span>{" "}
              Visual Prompt
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                VP
              </span>{" "}
              Verbal Prompt
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                IND
              </span>{" "}
              Independent
            </span>
          </div>
        </div>

        {/* Behavior & Compliance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-zinc-300">
              Behavior
            </label>
            <div className="flex flex-col gap-2">
              {["Positive", "Neutral", "Refusal"].map((b) => (
                <ToggleBtn
                  key={b}
                  label={b}
                  selected={behavior === b}
                  onClick={() => setBehavior(b)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-zinc-300">
              Compliance
            </label>
            <div className="flex flex-col gap-2">
              {["Fully", "Partially", "Reminders"].map((c) => (
                <ToggleBtn
                  key={c}
                  label={c}
                  selected={compliance === c}
                  onClick={() => setCompliance(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Manipulatives */}
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
          {/* Fixed Alignment */}
          <div className="flex items-center justify-between">
            <label
              className="text-sm text-slate-700 dark:text-zinc-300 cursor-pointer select-none"
              htmlFor="mani-toggle"
            >
              Used Manipulatives?
            </label>
            <input
              type="checkbox"
              id="mani-toggle"
              checked={hasManipulatives}
              onChange={(e) => setHasManipulatives(e.target.checked)}
              className="w-5 h-5 accent-indigo-500 cursor-pointer"
            />
          </div>
          {hasManipulatives && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <select
                value={manipulativesType}
                onChange={(e) => setManipulativesType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="">Select Type...</option>
                {manipulativesList.map((m) => (
                  <option key={m.id} value={m.label}>
                    {m.label}
                  </option>
                ))}
              </select>
              <div className="text-right">
                <Link
                  href="/library?tab=tools"
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium"
                >
                  + Add or Edit Tools
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
            Session Notes
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Anecdotal data..."
              className="w-full px-3 py-2 pb-12 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={handleGenerateNarrative}
                className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                title="Magic Narrative"
              >
                <MagicIcon />
              </button>
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all ${
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
                title={isListening ? "Stop Listening" : "Dictate Note"}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {initialData && (
            <button
              type="button"
              onClick={onCancel}
              className="w-1/3 py-3 rounded-md font-bold transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="w-full py-3 font-bold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {initialData ? "Update Log Entry" : "Save Log Entry"}
          </button>
        </div>
      </form>

      {/* 3. ADD MODAL TO JSX */}
      <UpgradeModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}
