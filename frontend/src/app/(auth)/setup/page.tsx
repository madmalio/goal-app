"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromAPI } from "../../../utils/api";
import { useToast } from "../../../context/ToastContext";

// ... (Icons remain the same) ...
// I will just include the component logic to save space. Icons are standard.
const EyeIcon = () => (
  <svg
    className="w-5 h-5 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    className="w-5 h-5 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-emerald-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);
const XIcon = () => (
  <svg
    className="w-4 h-4 text-red-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function SetupPage() {
  const router = useRouter();
  const toast = useToast();

  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetchFromAPI("/status");
        if (res.is_setup === true) {
          router.replace("/login");
        } else {
          localStorage.clear(); // Clear stale data
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();
  }, [router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await fetchFromAPI("/setup", {
        method: "POST",
        // FIX: Sending full_name and school_name to DB
        body: JSON.stringify({
          email,
          password,
          full_name: teacherName,
          school_name: schoolName,
        }),
      });
      toast.success("System initialized! Please log in.");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err: any) {
      toast.error(err.message || "Setup failed");
    }
  };

  const isMatch = password && confirmPassword && password === confirmPassword;
  const isMismatch =
    password && confirmPassword && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Initial System Setup
        </h1>
        <p className="text-center text-slate-500 dark:text-zinc-400 mb-8">
          Configure your admin profile.
        </p>
        <form onSubmit={handleSetup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Teacher Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ms. Frizzle"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                School / District
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Walkerville Elementary"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-zinc-800 my-4"></div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@school.edu"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 dark:text-white pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Re-type password"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-950 dark:text-white pr-10 ${
                  isMismatch
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-300 dark:border-zinc-700"
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                {isMatch && <CheckIcon />} {isMismatch && <XIcon />}
                <div
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="cursor-pointer"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </div>
              </div>
            </div>
            <div className="h-4 mt-1 text-xs transition-all">
              {isMismatch && (
                <span className="text-red-500 font-medium">
                  Passwords do not match
                </span>
              )}
              {isMatch && (
                <span className="text-emerald-600 font-medium">
                  Passwords match
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
