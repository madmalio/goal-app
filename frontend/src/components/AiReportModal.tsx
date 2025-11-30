"use client";

import { useState, useEffect } from "react";
import * as webllm from "@mlc-ai/web-llm";
import { TrackingLog } from "../utils/db";
import { useToast } from "../context/ToastContext";

const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  goalDescription: string;
  logs: TrackingLog[];
}

export default function AiReportModal({
  isOpen,
  onClose,
  studentName,
  goalDescription,
  logs,
}: AiReportModalProps) {
  const toast = useToast();
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

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
        initProgressCallback: (report) => {
          console.log(report.text);
        },
        logLevel: "WARN",
      });

      setEngine(newEngine);
      setIsInitializing(false);
      generateReport(newEngine);
    } catch (err: any) {
      console.error("AI Init Error:", err);
      if (err.message?.includes("QuotaExceededError")) {
        setError("Storage Full: Please click 'Reset AI' below.");
      } else {
        setError("Failed to load AI: " + (err.message || "Unknown error"));
      }
      setIsInitializing(false);
    }
  };

  const handleResetCache = async () => {
    try {
      setIsInitializing(true);
      await webllm.deleteChatConfigInCache(SELECTED_MODEL);
      await webllm.deleteModelAllInfoInCache(SELECTED_MODEL);
      window.location.reload();
    } catch (e: any) {
      setError("Failed to reset: " + e.message);
    }
  };

  const generateReport = async (loadedEngine: webllm.MLCEngineInterface) => {
    if (!loadedEngine) return;
    setIsGenerating(true);
    setReport("");

    const firstName = studentName ? studentName.split(" ")[0] : "The student";

    try {
      const logSummary = logs
        .map(
          (l) =>
            `- Date: ${l.log_date}, Score: ${l.score}, Prompts: ${l.prompt_level}, Behavior: ${l.behavior}, Notes: ${l.notes}`
        )
        .join("\n");

      const messages: webllm.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You are a special education assistant writing a progress note.",
        },
        {
          role: "user",
          content: `
            Student: ${firstName}
            Goal: ${goalDescription}
            
            Data Logs:
            ${logSummary}
            
            Task: Write a professional, 1-paragraph progress summary. 
            Constraint: Do NOT use introductory text like "Here is a summary" or "Based on the data". Start directly with the student's name or "This week...".
          `,
        },
      ];

      const chunks = await loadedEngine.chat.completions.create({
        messages,
        temperature: 0.7,
        stream: true,
      });

      let fullText = "";
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta.content || "";
        fullText += delta;

        // Live cleaning: If the AI starts with "Here is...", remove it on the fly
        const cleanText = fullText
          .replace(/^Here is.*?:/i, "")
          .replace(/^Based on.*?:/i, "")
          .replace(/^Sure,.*?:/i, "")
          .trimStart();

        setReport(cleanText);
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
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            ✨ AI Progress Summarizer
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
              <strong>Error:</strong> {error}
              <div className="mt-3">
                <button
                  onClick={handleResetCache}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200"
                >
                  Reset AI Cache & Reload
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {isInitializing || (isGenerating && !report) ? (
            <div className="text-center py-16 space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2 animate-pulse">
                <p className="text-lg font-medium text-slate-700 dark:text-zinc-300">
                  {isInitializing
                    ? "Initializing AI Engine..."
                    : "Writing Report..."}
                </p>
                <p className="text-sm text-slate-400">
                  {isInitializing
                    ? "This runs locally on your device."
                    : "Analyzing data logs..."}
                </p>
              </div>
            </div>
          ) : (
            // REPORT CONTENT
            <div className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Generated Note:
                </p>
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-lg border border-slate-200 dark:border-zinc-800 min-h-[150px] whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-zinc-200 shadow-inner">
                  {report}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => generateReport(engine!)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(report);
                    toast.success("Copied to clipboard");
                    onClose();
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 ml-auto shadow-sm"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
