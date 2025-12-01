"use client";

import { useState } from "react";
import { dbService } from "../../utils/db";
import { backupService } from "../../utils/backupService";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../ConfirmModal";

export default function DangerZoneSection() {
  const toast = useToast();
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleWipeData = async () => {
    try {
      await dbService.resetDatabase();
      await backupService.disconnect();
      toast.success("All student data wiped.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Failed to wipe data.");
    }
  };

  return (
    <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-6 shadow-sm mt-12">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
        Danger Zone
      </h2>
      <div>
        <button
          onClick={() => setShowWipeModal(true)}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Wipe All Data (Factory Reset)
        </button>
      </div>
      <ConfirmModal
        isOpen={showWipeModal}
        onClose={() => setShowWipeModal(false)}
        onConfirm={handleWipeData}
        title="Wipe All Data?"
        message="This will permanently delete ALL students, goals, and logs. This cannot be undone."
        confirmText="Wipe Everything"
        isDestructive={true}
        verificationText="WIPE DATA"
      />
    </section>
  );
}
