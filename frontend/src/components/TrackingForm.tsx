"use client";

import { useState, useEffect, useRef } from "react";
import { TrackingLog } from "../utils/db";
import { useToast } from "../context/ToastContext";

// Reusing your icons and smaller components locally for this form
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

interface TrackingFormProps {
  studentName: string;
  goalId: number;
  initialData?: TrackingLog | null; // If passed, we are in "Edit Mode"
  onSubmit: (data: Partial<TrackingLog>) => Promise<void>;
  onCancel: () => void;
}

export default function TrackingForm({
  studentName,
  goalId,
  initialData,
  onSubmit,
  onCancel,
}: TrackingFormProps) {
  const toast = useToast();

  // State
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [scoreNum, setScoreNum] = useState("");
  const [scoreDenom, setScoreDenom] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [compliance, setCompliance] = useState("");
  const [behavior, setBehavior] = useState("");
  const [hasManipulatives, setHasManipulatives] = useState(false);
  const [manipulativesType, setManipulativesType] = useState("");
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setDate(initialData.log_date);
      if (initialData.score && initialData.score.includes("/")) {
        const [n, d] = initialData.score.split("/");
        setScoreNum(n);
        setScoreDenom(d);
      } else {
        setScoreNum(initialData.score || "");
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
  }, [initialData]);

  const resetForm = () => {
    setScoreNum("");
    setScoreDenom("");
    setTimeSpent("");
    setPrompts([]);
    setCompliance("");
    setBehavior("");
    setHasManipulatives(false);
    setManipulativesType("");
    setNotes("");
    setDate(new Date().toLocaleDateString("en-CA"));
  };

  const togglePrompt = (p: string) => {
    setPrompts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // Logic from [cite: 426]
  const handleGenerateNarrative = () => {
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

    if (scoreNum) {
      let perf = `They achieved a score of ${scoreNum}`;
      if (scoreDenom) perf += `/${scoreDenom}`;
      if (prompts.length > 0) {
        const expand: Record<string, string> = {
          HOH: "Hand-over-Hand",
          VIP: "Visual Prompts",
          VP: "Verbal Prompts",
          IND: "Independence",
        };
        const pText = prompts.map((p) => expand[p] || p).join(" and ");
        perf += ` with ${pText}`;
      }
      parts.push(perf + ".");
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

  // Logic from [cite: 419]
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser does not support voice.");
      return;
    }
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
    const finalScore =
      scoreNum && scoreDenom ? `${scoreNum}/${scoreDenom}` : scoreNum;
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

    if (!initialData) resetForm(); // Only reset if adding new
  };

  return (
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

      {/* Date, Time, Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
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
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-zinc-300">
            Score (Correct / Total)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={scoreNum}
              onChange={(e) => setScoreNum(e.target.value)}
              placeholder="20"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center"
            />
            <span className="text-slate-400 font-bold text-xl">/</span>
            <input
              type="text"
              inputMode="numeric"
              value={scoreDenom}
              onChange={(e) => setScoreDenom(e.target.value)}
              placeholder="25"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-center"
            />
          </div>
        </div>
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
      </div>

      {/* Behavior & Compliance Grid */}
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-slate-700 dark:text-zinc-300">
            Used Manipulatives?
          </label>
          <input
            type="checkbox"
            checked={hasManipulatives}
            onChange={(e) => setHasManipulatives(e.target.checked)}
            className="w-5 h-5 accent-indigo-500"
          />
        </div>
        {hasManipulatives && (
          <select
            value={manipulativesType}
            onChange={(e) => setManipulativesType(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="">Select Type...</option>
            <option value="Visual Aid">Visual Aid</option>
            <option value="Counters">Counters</option>
            <option value="Tracing">Tracing</option>
          </select>
        )}
      </div>

      {/* Notes & Actions */}
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
  );
}
