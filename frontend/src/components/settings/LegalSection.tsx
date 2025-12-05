"use client";

import { useState } from "react";
import LegalModal from "../LegalModal";

const DocumentIcon = () => (
  <svg
    className="w-4 h-4 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    className="w-6 h-6 text-emerald-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DatabaseIcon = () => (
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
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="w-6 h-6 text-amber-500"
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

export default function LegalSection() {
  const [modalType, setModalType] = useState<"privacy" | "terms" | null>(null);

  // --- PRIVACY POLICY CONTENT ---
  const PrivacyContent = (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-zinc-400 text-center italic">
        Effective Date: {new Date().getFullYear()}
      </p>

      {/* Section 1 */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <DatabaseIcon />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              1. Local-First Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Vaute stores 100% of your data (students, goals, logs) exclusively
              within your web browser's internal database. We do not have
              servers, we do not have a cloud database, and we cannot see your
              data.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <LockIcon />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              2. Data Ownership & Safety
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Since data lives on your device, you are the sole owner. However,{" "}
              <strong>
                clearing your browser cache will delete your records
              </strong>
              . It is your responsibility to use the "Export Backup" or
              "Auto-Save" features regularly.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 - RESTORED */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <ShieldCheckIcon />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              3. Compliance (FERPA/COPPA)
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Because no data is transmitted to the internet, this application
              is inherently compliant with student privacy laws regarding data
              transmission. Security relies on the physical control of this
              device.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4 - NEW LEMON SQUEEZY */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <ShieldCheckIcon />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              4. License Verification
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              To verify Pro licenses, this app connects to{" "}
              <strong>Lemon Squeezy</strong>. We send your License Key and a
              unique device ID to their servers to validate your purchase. No
              student data is ever sent with this request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- TERMS OF SERVICE CONTENT ---
  const TermsContent = (
    <div className="space-y-6 text-sm text-slate-600 dark:text-zinc-300">
      {/* 1. Acceptance */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
          1. Acceptance of Terms
        </h3>
        <p className="text-xs leading-relaxed">
          By downloading, installing, or using Vaute ("the Application"), you
          agree to be bound by these terms. If you do not agree to these terms,
          do not use the Application.
        </p>
      </div>

      {/* 2. Merchant of Record - NEW */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
          2. Merchant of Record
        </h3>
        <p className="text-xs leading-relaxed">
          Our order process is conducted by our online reseller,{" "}
          <strong>Lemon Squeezy</strong>. Lemon Squeezy is the Merchant of
          Record for all our orders and handles all payment security and tax
          compliance.
        </p>
      </div>

      {/* 3. Disclaimer (Standard "AS IS" Clause) */}
      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
        <div className="flex gap-3">
          <div className="mt-1 text-amber-500">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
              3. Disclaimer of Warranty
            </h3>
            <p className="text-[11px] leading-relaxed font-medium uppercase text-amber-900/80 dark:text-amber-400/80">
              The software is provided "AS IS", without warranty of any kind,
              express or implied, including but not limited to the warranties of
              merchantability, fitness for a particular purpose and
              noninfringement. In no event shall the authors or copyright
              holders be liable for any claim, damages or other liability.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Data Liability */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
          4. Data Loss & Liability
        </h3>
        <p className="text-xs leading-relaxed mb-2">
          You acknowledge that this Application runs locally on your device. The
          developer does not maintain a backup of your data.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            The User is solely responsible for performing regular backups using
            the provided "Export" tools.
          </li>
          <li>
            The Developer is not liable for loss of educational records due to
            browser updates, cache clearing, device failure, or user error.
          </li>
        </ul>
      </div>

      {/* 5. Termination - RESTORED */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
          5. Termination
        </h3>
        <p className="text-xs leading-relaxed">
          You may terminate this agreement at any time by deleting the
          Application and all local data from your device.
        </p>
      </div>
    </div>
  );

  return (
    <section className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800">
      <div className="flex justify-center gap-8">
        <button
          onClick={() => setModalType("privacy")}
          className="text-xs text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 font-medium flex items-center transition-colors"
        >
          <DocumentIcon /> Privacy Policy
        </button>
        <button
          onClick={() => setModalType("terms")}
          className="text-xs text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 font-medium flex items-center transition-colors"
        >
          <DocumentIcon /> Terms of Use
        </button>
      </div>
      <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-4 text-center">
        Vaute v1.0.0 • Local-First Secure Environment
      </p>

      <LegalModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === "privacy" ? "Privacy Policy" : "Terms of Use"}
        content={modalType === "privacy" ? PrivacyContent : TermsContent}
      />
    </section>
  );
}
