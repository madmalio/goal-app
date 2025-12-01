"use client";

import { useState } from "react";
import { usePrivacy } from "../../context/PrivacyContext";
import { dbService } from "../../utils/db";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../ConfirmModal";

const LockIcon = () => (
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
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const TrashIcon = () => (
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
);

export default function SecuritySection() {
  const { setAutoLockTimer, refreshPinStatus, hasPin } = usePrivacy();
  const toast = useToast();

  const [pin, setPin] = useState("");
  const [autoLockMinutes, setAutoLockMinutes] = useState(
    Number(localStorage.getItem("auto_lock_minutes")) || 0
  );
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    try {
      await dbService.setPin(pin);
      toast.success(hasPin ? "PIN updated successfully" : "Security PIN set");
      setPin("");
      refreshPinStatus();
    } catch (err) {
      toast.error("Failed to set PIN");
    }
  };

  const confirmRemovePin = async () => {
    try {
      await dbService.removePin();
      toast.success("PIN removed");
      refreshPinStatus();
      setPin("");
    } catch (err) {
      toast.error("Failed to remove PIN");
    }
  };

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setAutoLockMinutes(val);
    setAutoLockTimer(val);
    toast.success(`Auto-lock set to ${val === 0 ? "Never" : val + " minutes"}`);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 dark:text-white text-slate-800">
        Security
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        {/* PIN SECTION */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-zinc-400">
              App Lock PIN
            </h3>
            {hasPin ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                Active
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700">
                Not Set
              </span>
            )}
          </div>
          <form
            onSubmit={handleSetPin}
            className="flex gap-2 items-stretch mb-2"
          >
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <LockIcon />
              </div>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={hasPin ? "Enter new PIN" : "Set 4-digit PIN"}
                className="w-full pl-9 pr-3 py-2 border rounded-md bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
              >
                {hasPin ? "Update" : "Save"}
              </button>
              {hasPin && (
                <button
                  type="button"
                  onClick={() => setShowRemovePinModal(true)}
                  className="px-3 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
                  title="Remove PIN"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* AUTO LOCK SECTION */}
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">
            Auto-Lock Timer
          </h3>
          <select
            value={autoLockMinutes}
            onChange={handleAutoLockChange}
            className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
          >
            <option value={0}>Never Auto-lock</option>
            <option value={1}>1 Minute</option>
            <option value={5}>5 Minutes</option>
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
          </select>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRemovePinModal}
        onClose={() => setShowRemovePinModal(false)}
        onConfirm={confirmRemovePin}
        title="Remove PIN?"
        message="This will disable the lock screen."
        confirmText="Remove PIN"
        isDestructive={true}
      />
    </section>
  );
}
