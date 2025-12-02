"use client";

import { APP_CONFIG } from "../config";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900 overflow-hidden animate-scale-in">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 text-white">
            <svg
              className="w-6 h-6"
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
          </div>
          <h2 className="text-xl font-bold text-white">Upgrade to Pro</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Unlock Professional Tools
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-600 dark:text-zinc-300 text-center leading-relaxed">
            <p className="mb-4">
              You've hit a limit! Upgrade to <strong>Goal Master Pro</strong> to
              unlock:
            </p>
            <ul className="text-left list-disc pl-8 space-y-2 mb-4 text-xs sm:text-sm">
              <li>
                <strong>Unlimited Students</strong> (Remove the{" "}
                {APP_CONFIG.FREE_STUDENT_LIMIT}-student cap)
              </li>
              <li>
                <strong>Unlimited Goal Library</strong> (Save more than{" "}
                {APP_CONFIG.FREE_GOAL_LIMIT} templates)
              </li>
              <li>
                <strong>Voice Dictation</strong> (Speech-to-Text notes)
              </li>
              <li>
                <strong>Smart Goal Wizard</strong> (AI-powered writing)
              </li>
              <li>
                <strong>Data Exports</strong> (PDF Reports & CSV)
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={APP_CONFIG.PURCHASE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
            >
              Get Lifetime Access
            </a>
            <button
              onClick={onClose}
              className="block w-full py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            Already have a key? Go to Settings to activate.
          </p>
        </div>
      </div>
    </div>
  );
}
