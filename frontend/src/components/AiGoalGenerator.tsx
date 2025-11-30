"use client";

import { useState, useEffect } from "react";
import * as webllm from "@mlc-ai/web-llm";

const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

interface AiGoalGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  studentName: string;
  grade: string;
  classType?: string;
  onSelectGoal: (description: string) => void;
}

export default function AiGoalGenerator({
  isOpen,
  onClose,
  subject,
  studentName,
  grade,
  classType = "General Ed",
  onSelectGoal,
}: AiGoalGeneratorProps) {
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  // Track retries to vary the prompt
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setRetryCount(0);

    navigator.gpu
      ?.requestAdapter()
      .then((adapter) => {
        if (!adapter) {
          setError("Your device does not support WebGPU.");
        } else {
          initAI();
        }
      })
      .catch(() => setError("WebGPU check failed."));
  }, [isOpen]);

  const initAI = async () => {
    try {
      setIsInitializing(true);
      const newEngine = await webllm.CreateMLCEngine(SELECTED_MODEL, {
        initProgressCallback: () => {},
        logLevel: "WARN",
      });
      setEngine(newEngine);
      setIsInitializing(false);
      if (subject) generateOptions(newEngine, subject, 0);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load AI.");
      setIsInitializing(false);
    }
  };

  // --- DYNAMIC EXAMPLES ---
  const getSubjectExamples = (subj: string, name: string) => {
    const s = subj.toLowerCase();
    if (s.includes("math")) {
      return `
        - ${name} will solve single-digit addition problems.
        - ${name} will identify numbers 1-20.
      `;
    } else if (s.includes("reading") || s.includes("ela")) {
      return `
        - ${name} will read 10 sight words.
        - ${name} will answer "who" questions about a text.
      `;
    } else {
      return `
        - ${name} will complete the task with 80% accuracy.
        - ${name} will follow the classroom routine.
      `;
    }
  };

  const generateOptions = async (
    aiEngine: webllm.MLCEngineInterface,
    subj: string,
    retries: number
  ) => {
    if (!aiEngine) return;
    setIsGenerating(true);
    setOptions([]);
    setError("");

    const firstName = studentName ? studentName.split(" ")[0] : "Student";
    const gradeLevel = grade || "K";

    let contextNote = "Standard academic goals.";
    if (classType === "SES3")
      contextNote =
        "Severe needs. Focus on PRE-ACADEMIC and FUNCTIONAL skills (matching, identifying). Keep it extremely simple.";
    else if (classType === "SES2")
      contextNote =
        "Moderate needs. Focus on FOUNDATIONAL skills. Use concrete verbs.";
    else if (classType === "SES1") contextNote = "Behavioral focus.";

    const dynamicExamples = getSubjectExamples(subj, firstName);
    const variationInstruction =
      retries > 0 ? "Provide DIFFERENT options than before." : "";

    try {
      const prompt = `
        Task: Write 3 simple IEP goals for ${firstName} (Grade ${gradeLevel}).
        Subject: ${subj}.
        Context: ${contextNote}.
        ${variationInstruction}
        
        Style Guide:
        ${dynamicExamples}

        Strict Rules:
        1. Start every line with "${firstName} will...".
        2. Use ACTIVE verbs (e.g. read, write, match). 
        3. Do NOT start with -ing words (e.g. "Reading").
        4. Keep it under 20 words per goal.
        5. Do NOT include timeframes.
        6. Output ONLY the list.
      `;

      const stream = await aiEngine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature: retries > 0 ? 0.75 : 0.5,
        stream: true,
      });

      let fullText = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta.content || "";
        fullText += delta;

        const rawLines = fullText
          .split("\n")
          .filter((line) => line.trim().length > 0);

        const validGoals = rawLines
          .map((line) => line.trim())
          .filter((line) => {
            if (line.length < 10) return false;
            // Filter out common header patterns
            if (/^(Goal|Objective)\s*\d+[:.]/i.test(line)) return true; // Keep "Goal 1" lines to clean later
            if (line.includes(":")) return false; // Generic headers
            if (line.toLowerCase().startsWith("i can")) return false;
            if (line.toLowerCase().startsWith("here are")) return false;
            return true;
          })
          .map((line) => {
            // 1. Clean numbering (1., -, Goal 1:)
            let clean = line
              .replace(/^(Goal|Objective)\s*\d+[:.]\s*/i, "")
              .replace(/^[\d\-\*\•]+\.?\s*/, "");

            // 2. Remove Timeframes
            clean = clean
              .replace(/within \d+ (weeks|days)/gi, "")
              .replace(/by the end.*/gi, "");

            // 3. GRAMMAR FIXER
            // Case A: Starts with -ing (Gerund) -> "Lucy will practice reading..."
            if (/^[A-Z][a-z]+ing\b/.test(clean)) {
              clean = `${firstName} will practice ${
                clean.charAt(0).toLowerCase() + clean.slice(1)
              }`;
            }
            // Case B: Starts with "be able to" (Passive) -> "Lucy will..."
            else if (clean.toLowerCase().startsWith("be able to")) {
              clean = `${firstName} will ${clean.substring(10)}`;
            }
            // Case C: Doesn't start with name -> "Lucy will..."
            else if (!clean.toLowerCase().startsWith(firstName.toLowerCase())) {
              if (!clean.toLowerCase().startsWith("will")) {
                clean = `${firstName} will ${
                  clean.charAt(0).toLowerCase() + clean.slice(1)
                }`;
              } else {
                clean = `${firstName} ${clean}`;
              }
            }

            return clean.trim();
          })
          .slice(0, 3);

        if (validGoals.length > 0) {
          setOptions(validGoals);
        }
      }
    } catch (err: any) {
      setError("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            ✨ AI Ideas for{" "}
            <span className="text-indigo-600">{subject || "..."}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
          {isInitializing || (isGenerating && options.length === 0) ? (
            <div className="text-center py-16 space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2 animate-pulse">
                <p className="text-lg font-medium text-slate-700 dark:text-zinc-300">
                  {isInitializing
                    ? "Initializing AI Engine..."
                    : "Drafting Goals..."}
                </p>
                <p className="text-sm text-slate-400">
                  {isInitializing
                    ? "This runs locally on your device."
                    : `Thinking about ${
                        studentName ? studentName : "the student"
                      }...`}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelectGoal(opt);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group animate-fade-in"
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed">
                      {opt}
                    </p>
                    <span className="opacity-0 group-hover:opacity-100 text-indigo-600 text-xs font-bold whitespace-nowrap mt-1">
                      Use This →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-b-xl flex justify-between items-center">
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-slate-400 hover:text-red-500 underline"
          >
            Reset AI
          </button>
          <button
            onClick={() => {
              const nextRetry = retryCount + 1;
              setRetryCount(nextRetry);
              if (engine) generateOptions(engine, subject, nextRetry);
            }}
            disabled={isGenerating || isInitializing}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            ↻ Try Different Ideas
          </button>
        </div>
      </div>
    </div>
  );
}
