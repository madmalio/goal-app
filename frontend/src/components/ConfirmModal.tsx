"use client";

import { useState, useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  verificationText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isDestructive = false,
  verificationText,
}: ConfirmModalProps) {
  const [input, setInput] = useState("");

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) setInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = verificationText
    ? input !== verificationText
    : false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-xl shadow-2xl border p-6 animate-fade-in-up bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800">
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-zinc-400 mb-6">{message}</p>

        {verificationText && (
          <div className="mb-6">
            <label className="block text-xs uppercase font-bold text-slate-500 dark:text-zinc-500 mb-1">
              Type{" "}
              <span className="select-all text-indigo-600 dark:text-indigo-400">
                "{verificationText}"
              </span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // Placeholder removed for clarity
              className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 outline-none"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
