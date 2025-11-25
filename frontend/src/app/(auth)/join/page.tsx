"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchFromAPI } from "../../../utils/api";
import { useToast } from "../../../context/ToastContext";

const EyeIcon = () => (
  <svg
    className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
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
    className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const toast = useToast();

  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchFromAPI(`/invites/${token}`)
      .then(() => setValid(true))
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await fetchFromAPI(`/invites/${token}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      toast.success("Account created successfully!");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      toast.error("Failed to create account. Email might be taken.");
    }
  };

  if (loading)
    return <div className="p-8 text-center">Verifying invite...</div>;
  if (!valid)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Invalid Invite
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Join Goal Master
        </h1>
        <p className="text-center text-slate-500 dark:text-zinc-400 mb-8">
          Set up your Assistant account.
        </p>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Your Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Set Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {" "}
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}{" "}
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
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {" "}
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}{" "}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
}
