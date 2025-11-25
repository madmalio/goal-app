"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { fetchFromAPI } from "../../../utils/api";
import ConfirmModal from "../../../components/ConfirmModal";
import { useToast } from "../../../context/ToastContext";

// --- ICONS ---
const SunIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const SystemIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ShieldExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface Student {
  id: number;
  name: string;
  student_id: string;
  active: boolean;
}

interface User {
  id: number;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRestoreDbModal, setShowRestoreDbModal] = useState(false);
  const [showSaveDefaultsModal, setShowSaveDefaultsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
  const [studentToRestore, setStudentToRestore] = useState<Student | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Danger Zone State
  const [showWipeDataModal, setShowWipeDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTeacher = localStorage.getItem("teacherName");
    const savedSchool = localStorage.getItem("schoolName");
    const savedEmail = localStorage.getItem("user_email");
    
    if (savedTeacher) setTeacherName(savedTeacher);
    if (savedSchool) setSchoolName(savedSchool);
    if (savedEmail) setCurrentUserEmail(savedEmail);

    loadArchivedStudents();
    loadUsers();
  }, []);

  const loadArchivedStudents = async () => {
    try {
      const data = await fetchFromAPI("/students?archived=true");
      setArchivedStudents(data);
    } catch (err) {
      console.error("Failed to load archived students", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchFromAPI("/users");
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const handleUnarchiveClick = (student: Student) => setStudentToRestore(student);

  const confirmUnarchive = async () => {
    if (!studentToRestore) return;
    try {
      await fetchFromAPI(`/students/${studentToRestore.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: studentToRestore.name,
          student_id: studentToRestore.student_id,
          active: true,
        }),
      });
      loadArchivedStudents();
      toast.success("Student restored");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error("Failed to restore student");
    } finally {
      setStudentToRestore(null);
    }
  };

  const confirmSaveDefaults = () => {
    localStorage.setItem("teacherName", teacherName);
    localStorage.setItem("schoolName", schoolName);
    setShowSaveDefaultsModal(false);
    toast.success("Report defaults saved");
  };

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";
      const res = await fetch(`${API_URL}/backup`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goal-master-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmRestoreDb = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await fetchFromAPI("/restore", { method: "POST", body: JSON.stringify(json) });
      toast.success("Database restored! Reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Failed to restore backup.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const res = await fetchFromAPI("/invites", { method: "POST" });
      const link = `${window.location.origin}/join?token=${res.token}`;
      setInviteLink(link);
      toast.success("Invite generated");
    } catch (err) {
      toast.error("Failed to generate invite");
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Copied to clipboard!");
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      await fetchFromAPI(`/users/${user.id}/role`, { method: "PUT", body: JSON.stringify({ role: newRole }) });
      loadUsers();
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update role.");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await fetchFromAPI(`/users/${userToDelete.id}`, { method: "DELETE" });
      loadUsers();
      toast.success("User removed");
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setUserToDelete(null);
    }
  };

  // DANGER ZONE ACTIONS
  const handleWipeData = async () => {
    try {
      await fetchFromAPI("/reset", { method: "DELETE" });
      toast.success("All data wiped.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Failed to wipe data.");
    }
  };

  const handleDeleteMyAccount = async () => {
    const me = users.find(u => u.email === currentUserEmail);
    if (!me) return;
    try {
      await fetchFromAPI(`/users/${me.id}`, { method: "DELETE" });
      await fetchFromAPI("/logout", { method: "POST" });
      
      // FIX: Clear local storage on account deletion
      localStorage.clear();
      
      window.location.href = "/login";
    } catch (err) {
      toast.error("Cannot delete account. You might be the only admin.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold dark:text-white text-slate-900">App Settings</h1>

      {/* 1. APPEARANCE */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 dark:text-white text-slate-800">Appearance</h2>
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => setTheme("light")} className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${theme === "light" ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500" : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}><SunIcon /><span className="font-medium text-sm">Light</span></button>
          <button onClick={() => setTheme("dark")} className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${theme === "dark" ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500" : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}><MoonIcon /><span className="font-medium text-sm">Dark</span></button>
          <button onClick={() => setTheme("system")} className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all h-24 ${theme === "system" ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500" : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}><SystemIcon /><span className="font-medium text-sm">System</span></button>
        </div>
      </section>

      {/* 2. REPORT DEFAULTS */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">Report Defaults</h2>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Teacher Name</label>
            <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="e.g. Ms. Frizzle" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">School Name</label>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Walkerville Elementary" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
          </div>
          <button onClick={() => setShowSaveDefaultsModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors">Save Defaults</button>
        </div>
      </section>

      {/* 3. USER MANAGEMENT */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold dark:text-white text-slate-800">User Management</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Manage accounts and permissions.</p>
          </div>
          <button onClick={handleGenerateInvite} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors text-sm">+ Invite User</button>
        </div>

        {inviteLink && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 animate-fade-in-down">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">Invite Link (One-time use):</p>
            <div className="flex gap-0 items-stretch">
                <code className="block flex-1 p-3 bg-white dark:bg-zinc-900 border border-r-0 rounded-l-md border-slate-300 dark:border-zinc-700 text-sm select-all break-all dark:text-zinc-300 flex items-center">
                  {inviteLink}
                </code>
                <button 
                  onClick={copyInviteLink} 
                  className="px-4 bg-white dark:bg-zinc-900 border border-l-0 rounded-r-md border-slate-300 dark:border-zinc-700 text-slate-500 hover:text-indigo-600 transition-colors"
                  title="Copy Link"
                >
                  <CopyIcon />
                </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">This link can only be used once.</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-zinc-950 text-xs uppercase text-slate-500 dark:text-zinc-500 font-medium">
              <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {users.map((u) => {
                const isMe = u.email === currentUserEmail;
                return (
                  <tr key={u.id} className={`bg-white dark:bg-zinc-900 ${isMe ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{u.email} {isMe && <span className="text-xs text-indigo-500 font-bold ml-2">(You)</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2 text-sm">
                      {!isMe ? (
                        <>
                          {u.role === "admin" ? (
                            <button onClick={() => handleChangeRole(u, "assistant")} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Demote"><ShieldExclamationIcon /></button>
                          ) : (
                            <button onClick={() => handleChangeRole(u, "admin")} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Promote"><ShieldCheckIcon /></button>
                          )}
                          <button onClick={() => setUserToDelete(u)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove"><TrashIcon /></button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic py-1.5">Current User</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. DATA MANAGEMENT */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">Data Management</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">Export your data for backup, or restore from a previous backup file.</p>
        <div className="flex gap-4">
          <button onClick={handleDownloadBackup} disabled={downloading || uploading} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-md font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export Database
          </button>
          <button onClick={() => setShowRestoreDbModal(true)} disabled={downloading || uploading} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Restore Database
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </section>

      {/* 5. ARCHIVED STUDENTS */}
      {archivedStudents.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2 dark:text-white text-slate-800">Archived Students</h2>
          <div className="space-y-3">
            {archivedStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 border-slate-200 dark:bg-zinc-950 dark:border-zinc-800">
                <div><h4 className="font-bold text-slate-900 dark:text-white">{s.name}</h4></div>
                <button onClick={() => handleUnarchiveClick(s)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Restore</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. DANGER ZONE */}
      <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-6 shadow-sm mt-12">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">Destructive actions. Be careful.</p>
        <div className="flex gap-4">
          <button onClick={() => setShowWipeDataModal(true)} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Wipe All Student Data</button>
          <button onClick={() => setShowDeleteAccountModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors">Delete My Account</button>
        </div>
      </section>

      {/* MODALS */}
      <ConfirmModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={handleDeleteUser} title="Remove User?" message={`Remove ${userToDelete?.email}? They will lose access.`} confirmText="Remove User" isDestructive={true} />
      <ConfirmModal isOpen={showRestoreDbModal} onClose={() => setShowRestoreDbModal(false)} onConfirm={handleConfirmRestoreDb} title="Restore Database?" message="This will overwrite all current data." confirmText="Restore" isDestructive={true} />
      <ConfirmModal isOpen={!!studentToRestore} onClose={() => setStudentToRestore(null)} onConfirm={confirmUnarchive} title="Restore Student?" message={`Restore ${studentToRestore?.name}?`} confirmText="Restore" />
      <ConfirmModal isOpen={showSaveDefaultsModal} onClose={() => setShowSaveDefaultsModal(false)} onConfirm={confirmSaveDefaults} title="Update Defaults?" message="Apply changes to future reports?" confirmText="Save" />
      
      {/* Danger Zone Modals - UPPERCASE VERIFICATION */}
      <ConfirmModal 
        isOpen={showWipeDataModal} 
        onClose={() => setShowWipeDataModal(false)} 
        onConfirm={handleWipeData} 
        title="Wipe All Data?" 
        message="This will permanently delete ALL students, goals, and logs. This cannot be undone." 
        confirmText="Wipe Everything" 
        isDestructive={true}
        verificationText="WIPE DATA" 
      />
      <ConfirmModal 
        isOpen={showDeleteAccountModal} 
        onClose={() => setShowDeleteAccountModal(false)} 
        onConfirm={handleDeleteMyAccount} 
        title="Delete Your Account?" 
        message="This will permanently delete your admin account. If you are the only admin, you cannot do this." 
        confirmText="Delete My Account" 
        isDestructive={true}
        verificationText="DELETE ACCOUNT"
      />

      <section className="bg-indigo-50 dark:bg-zinc-900/50 border border-indigo-100 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">About Goal Master</h3>
        <p className="text-sm text-indigo-700 dark:text-zinc-400 mt-1">Version 1.0.0 • Local Chromebook Edition</p>
      </section>
    </div>
  );
}