"use client";

import { useState, useMemo } from "react";
import { useToast } from "../context/ToastContext";
import { useInstall } from "../context/InstallContext";

const DownloadIcon = () => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const ShareIcon = () => (
  <svg
    className="w-5 h-5 inline-block mx-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

export default function InstallAppButton() {
  const { installPrompt, isIOS, isStandalone, clearPrompt, waitForPrompt } =
    useInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const toast = useToast();

  const supportsBIP = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "onbeforeinstallprompt" in window || "BeforeInstallPromptEvent" in window
    );
  }, []);

  const shouldShow = !isStandalone && (isIOS || !!installPrompt || supportsBIP);

  const handleInstallClick = async () => {
    if (isIOS && !installPrompt) {
      setShowIOSInstructions(true);
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        clearPrompt();
        toast.success("Installing Vaute...");
      }
      return;
    }

    const got = await waitForPrompt(3000);
    if (got) {
      got.prompt();
      await got.userChoice;
      clearPrompt();
      return;
    }

    toast.info("If no prompt appears, use your browser menu to “Install app”.");
  };

  if (!shouldShow) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 border border-transparent rounded-lg shadow-md text-sm font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg animate-fade-in"
      >
        <DownloadIcon /> <span>Install App</span>
      </button>

      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Install on iPhone/iPad
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>
            <ol className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 font-bold text-indigo-600 bg-indigo-100 rounded-full shrink-0 text-xs">
                  1
                </span>
                <span>
                  Tap the <ShareIcon /> <strong>Share</strong> button in Safari.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 font-bold text-indigo-600 bg-indigo-100 rounded-full shrink-0 text-xs">
                  2
                </span>
                <span>
                  Scroll and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 font-bold text-indigo-600 bg-indigo-100 rounded-full shrink-0 text-xs">
                  3
                </span>
                <span>
                  Confirm by tapping <strong>Add</strong>.
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
