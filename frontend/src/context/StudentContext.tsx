"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dbService, Student } from "../utils/db";

interface StudentContextType {
  students: Student[];
  refreshStudents: () => Promise<void>;
  // NEW: Modal Controls
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // <--- State

  const refreshStudents = async () => {
    try {
      const data = await dbService.getStudents(false);
      setStudents(data);
    } catch (e) {
      console.error("Failed to fetch students", e);
    }
  };

  useEffect(() => {
    refreshStudents();
  }, []);

  return (
    <StudentContext.Provider
      value={{
        students,
        refreshStudents,
        isAddModalOpen,
        openAddModal: () => setIsAddModalOpen(true),
        closeAddModal: () => setIsAddModalOpen(false),
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context)
    throw new Error("useStudent must be used within a StudentProvider");
  return context;
}
