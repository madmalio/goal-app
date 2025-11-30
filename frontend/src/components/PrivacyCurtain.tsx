"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePrivacy } from "../context/PrivacyContext";
import { dbService } from "../utils/db"; // UPDATED import

export default function PrivacyCurtain() {
  const pathname = usePathname();
  const { isLocked, unlockApp } = usePrivacy();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    if (isLocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // UPDATED: Check local DB
      const isValid = await dbService.verifyPin(pin);

      if (isValid) {
        setPin("");
        setError(false);
        unlockApp();
      } else {
        throw new Error("Invalid PIN");
      }
    } catch (err) {
      setError(true);
      setPin("");
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-slate-200 dark:border-zinc-800">
        <div className="mb-6 flex justify-center text-indigo-600 dark:text-indigo-400">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 
              2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          App Locked
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mb-6 text-sm">
          Enter your PIN to resume.
        </p>

        <form onSubmit={handleUnlock}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            className={`w-32 text-center text-2xl tracking-[0.5em] font-bold py-3 border-b-2 outline-none bg-transparent transition-colors mb-6
              ${
                error
                  ? "border-red-500 text-red-600"
                  : "border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:border-indigo-500"
              }`}
            placeholder="••••"
            autoComplete="off"
          />

          {error && (
            <p className="text-red-500 text-xs mb-4 font-bold">Incorrect PIN</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
