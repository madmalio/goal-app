"use client";

import { useState, useEffect } from "react";
import AppearanceSection from "../../../components/settings/AppearanceSection";
import SecuritySection from "../../../components/settings/SecuritySection";
import ReportDefaultsSection from "../../../components/settings/ReportDefaultsSection";
import DataManagementSection from "../../../components/settings/DataManagementSection";
import DangerZoneSection from "../../../components/settings/DangerZoneSection";
import AboutSection from "../../../components/settings/AboutSection";
import LegalSection from "../../../components/settings/LegalSection";

export default function SettingsPage() {
  // We use this to prevent hydration mismatch errors (standard Next.js pattern)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold dark:text-white text-slate-900">
        App Settings
      </h1>

      <AppearanceSection />
      <SecuritySection />
      <ReportDefaultsSection />
      <DataManagementSection />
      <AboutSection />
      <DangerZoneSection />
      <LegalSection />
    </div>
  );
}
