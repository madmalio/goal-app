"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../utils/db";
import { APP_CONFIG } from "../../config";
import { useToast } from "../../context/ToastContext";

const KeyIcon = () => (
  <svg
    className="w-6 h-6 text-indigo-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

export default function LicenseSection() {
  // AUTOMATIC HIDE: If paywall is off, this component renders nothing.
  if (!APP_CONFIG.ENABLE_PAYWALL) return null;

  const toast = useToast();
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("inactive");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dbService.getLicenseStatus().then((data) => {
      if (data) {
        setLicenseKey(data.license_key || "");
        setStatus((data.license_status as "active" | "inactive") || "inactive");
      }
    });
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await dbService.activateLicense(licenseKey);
      if (success) {
        setStatus("active");
        toast.success("Pro Features Unlocked!");
      } else {
        toast.error("Invalid License Key");
      }
    } catch (e) {
      toast.error("Activation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <KeyIcon />
          </div>
          <div>
            <h2 className="text-xl font-semibold dark:text-white text-slate-800">
              Pro License
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {status === "active"
                ? "Your license is active. Thank you!"
                : "Unlock unlimited students."}
            </p>
          </div>
        </div>
        {status === "active" && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full">
            Active
          </span>
        )}
      </div>

      {status !== "active" && (
        <form onSubmit={handleActivate} className="flex gap-2">
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Enter your license key..."
            className="flex-1 px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "..." : "Activate"}
          </button>
        </form>
      )}
    </section>
  );
}
