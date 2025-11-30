import type { PGlite } from "@electric-sql/pglite";

// --- TYPES ---
export interface Student {
  id: number;
  name: string;
  student_id: string;
  grade: string;
  class_type: string;
  iep_date: string;
  active: boolean;
}

export interface Goal {
  id: number;
  student_id: number;
  subject: string;
  description: string;
  active: boolean;
  mastery_enabled: boolean;
  mastery_score: number;
  mastery_count: number;
  frequency: string;
  created_at: string;
}

export interface TrackingLog {
  id: number;
  goal_id: number;
  log_date: string;
  score: string;
  prompt_level: string;
  manipulatives_used: boolean;
  manipulatives_type: string;
  compliance: string;
  behavior: string;
  time_spent: string;
  notes: string;
  tester_name: string;
  created_at: string;
}

export interface Settings {
  teacher_name: string;
  school_name: string;
  privacy_pin: string | null;
  theme: string;
  last_backup_at: string | null;
}

export interface DashboardStats {
  student_count: number;
  active_goals: number;
  logs_this_week: number;
  recent_logs: any[];
}

export interface CustomGoalTemplate {
  id: number;
  subject: string;
  text: string;
  created_at: string;
}

// --- LAZY INITIALIZATION ---

let dbInstance: PGlite | null = null;

const getDB = async (): Promise<PGlite> => {
  if (typeof window === "undefined") {
    throw new Error("Cannot load PGlite on the server!");
  }
  if (dbInstance) return dbInstance;

  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite("idb://goal-master-db");
  await db.waitReady;
  dbInstance = db;
  return dbInstance;
};

export const initDB = async () => {
  if (typeof window === "undefined") return;

  try {
    const db = await getDB();

    // 1. Settings Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        teacher_name TEXT DEFAULT '',
        school_name TEXT DEFAULT '',
        privacy_pin TEXT,
        theme TEXT DEFAULT 'system',
        last_backup_at TEXT
      );
      INSERT INTO settings (id) VALUES (1) ON CONFLICT(id) DO NOTHING;
    `);

    // 2. Students Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        student_id TEXT NOT NULL,
        grade TEXT DEFAULT 'K', 
        class_type TEXT DEFAULT 'General Ed',
        iep_date DATE DEFAULT CURRENT_DATE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations
    try {
      await db.exec(
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'K'"
      );
    } catch (e) {}
    try {
      await db.exec(
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'General Ed'"
      );
    } catch (e) {}
    try {
      await db.exec(
        "ALTER TABLE settings ADD COLUMN IF NOT EXISTS last_backup_at TEXT"
      );
    } catch (e) {}

    // 3. Goals Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        mastery_enabled BOOLEAN DEFAULT FALSE,
        mastery_score INTEGER DEFAULT 80,
        mastery_count INTEGER DEFAULT 3,
        frequency TEXT DEFAULT 'Weekly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Logs Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tracking_logs (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        score TEXT,
        prompt_level TEXT,
        manipulatives_used BOOLEAN,
        manipulatives_type TEXT,
        compliance TEXT,
        behavior TEXT,
        time_spent TEXT,
        notes TEXT,
        tester_name TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Custom Goals Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS custom_goals (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Critical DB Init Error:", err);
    throw err;
  }
};

// --- DATA SERVICE ---

export const dbService = {
  // SETTINGS
  getSettings: async (): Promise<Settings> => {
    const db = await getDB();
    const res = await db.query(
      "SELECT teacher_name, school_name, privacy_pin, theme, last_backup_at FROM settings WHERE id = 1"
    );
    return res.rows[0] as Settings;
  },

  updateProfile: async (teacherName: string, schoolName: string) => {
    const db = await getDB();
    await db.query(
      "UPDATE settings SET teacher_name = $1, school_name = $2 WHERE id = 1",
      [teacherName, schoolName]
    );
  },

  setPin: async (pin: string) => {
    const db = await getDB();
    await db.query("UPDATE settings SET privacy_pin = $1 WHERE id = 1", [pin]);
  },

  verifyPin: async (inputPin: string): Promise<boolean> => {
    const db = await getDB();
    const res = await db.query("SELECT privacy_pin FROM settings WHERE id = 1");
    const storedPin = (res.rows[0] as any).privacy_pin;
    return storedPin === inputPin;
  },

  removePin: async () => {
    const db = await getDB();
    await db.query("UPDATE settings SET privacy_pin = NULL WHERE id = 1");
  },

  // STUDENTS
  getStudents: async (includeArchived = false): Promise<Student[]> => {
    const db = await getDB();
    const query = includeArchived
      ? "SELECT * FROM students ORDER BY name ASC"
      : "SELECT * FROM students WHERE active = true ORDER BY name ASC";
    const res = await db.query(query);
    return res.rows as unknown as Student[];
  },

  createStudent: async (
    name: string,
    studentId: string,
    grade: string,
    classType: string,
    iepDate: string
  ) => {
    const db = await getDB();
    const res = await db.query(
      "INSERT INTO students (name, student_id, grade, class_type, iep_date) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, studentId, grade, classType, iepDate]
    );
    return res.rows[0];
  },

  updateStudent: async (
    id: number,
    name: string,
    studentId: string,
    grade: string,
    classType: string,
    iepDate: string,
    active: boolean
  ) => {
    const db = await getDB();
    await db.query(
      "UPDATE students SET name = $1, student_id = $2, grade = $3, class_type = $4, iep_date = $5, active = $6 WHERE id = $7",
      [name, studentId, grade, classType, iepDate, active, id]
    );
  },

  deleteStudent: async (id: number) => {
    const db = await getDB();
    await db.query("DELETE FROM students WHERE id = $1", [id]);
  },

  // GOALS
  getGoals: async (studentId: number): Promise<Goal[]> => {
    const db = await getDB();
    const res = await db.query(
      "SELECT * FROM goals WHERE student_id = $1 AND active = true ORDER BY created_at DESC",
      [studentId]
    );
    return res.rows as unknown as Goal[];
  },

  getGoal: async (id: number): Promise<any> => {
    const db = await getDB();
    const res = await db.query(
      `
      SELECT g.*, s.name as student_name, s.student_id as student_id_str, s.grade, s.class_type, s.iep_date 
      FROM goals g 
      JOIN students s ON g.student_id = s.id 
      WHERE g.id = $1
    `,
      [id]
    );
    return res.rows[0];
  },

  createGoal: async (data: Partial<Goal>) => {
    const db = await getDB();
    await db.query(
      `INSERT INTO goals (student_id, subject, description, mastery_enabled, mastery_score, mastery_count, frequency) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.student_id,
        data.subject,
        data.description,
        data.mastery_enabled || false,
        data.mastery_score || 80,
        data.mastery_count || 3,
        data.frequency || "Weekly",
      ]
    );
  },

  updateGoal: async (id: number, data: Partial<Goal>) => {
    const db = await getDB();
    await db.query(
      `UPDATE goals SET subject=$1, description=$2, mastery_enabled=$3, mastery_score=$4, mastery_count=$5, frequency=$6 
       WHERE id=$7`,
      [
        data.subject,
        data.description,
        data.mastery_enabled,
        data.mastery_score,
        data.mastery_count,
        data.frequency,
        id,
      ]
    );
  },

  deleteGoal: async (id: number) => {
    const db = await getDB();
    await db.query("DELETE FROM goals WHERE id = $1", [id]);
  },

  // CUSTOM GOALS
  createCustomGoalTemplate: async (subject: string, text: string) => {
    const db = await getDB();
    await db.query("INSERT INTO custom_goals (subject, text) VALUES ($1, $2)", [
      subject,
      text,
    ]);
  },

  getCustomGoalTemplates: async (): Promise<CustomGoalTemplate[]> => {
    const db = await getDB();
    const res = await db.query(
      "SELECT * FROM custom_goals ORDER BY created_at DESC"
    );
    return res.rows as unknown as CustomGoalTemplate[];
  },

  // LOGS
  getLogs: async (goalId: number): Promise<TrackingLog[]> => {
    const db = await getDB();
    const res = await db.query(
      "SELECT * FROM tracking_logs WHERE goal_id = $1 ORDER BY log_date DESC, created_at DESC",
      [goalId]
    );
    return res.rows as unknown as TrackingLog[];
  },

  createLog: async (data: Partial<TrackingLog>) => {
    const db = await getDB();
    const settings = await dbService.getSettings();
    const tester = settings.teacher_name || "Teacher";

    await db.query(
      `INSERT INTO tracking_logs 
      (goal_id, log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, notes, tester_name) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        data.goal_id,
        data.log_date,
        data.score,
        data.prompt_level,
        data.manipulatives_used,
        data.manipulatives_type,
        data.compliance,
        data.behavior,
        data.time_spent,
        data.notes,
        tester,
      ]
    );
  },

  updateLog: async (id: number, data: Partial<TrackingLog>) => {
    const db = await getDB();
    await db.query(
      `UPDATE tracking_logs SET 
       log_date=$1, score=$2, prompt_level=$3, manipulatives_used=$4, manipulatives_type=$5, 
       compliance=$6, behavior=$7, time_spent=$8, notes=$9 
       WHERE id=$10`,
      [
        data.log_date,
        data.score,
        data.prompt_level,
        data.manipulatives_used,
        data.manipulatives_type,
        data.compliance,
        data.behavior,
        data.time_spent,
        data.notes,
        id,
      ]
    );
  },

  deleteLog: async (id: number) => {
    const db = await getDB();
    await db.query("DELETE FROM tracking_logs WHERE id = $1", [id]);
  },

  // DASHBOARD & BACKUP
  getDashboardStats: async (): Promise<DashboardStats> => {
    const db = await getDB();
    const studentCount = await db.query(
      "SELECT COUNT(*) as count FROM students WHERE active = true"
    );
    const activeGoals = await db.query(
      "SELECT COUNT(*) as count FROM goals WHERE active = true"
    );
    const logsThisWeek = await db.query(
      "SELECT COUNT(*) as count FROM tracking_logs WHERE log_date >= CURRENT_DATE - 7"
    );

    const recentLogs = await db.query(`
      SELECT s.name as student_name, g.subject, l.score, l.log_date, l.goal_id, s.id as student_id 
      FROM tracking_logs l 
      JOIN goals g ON l.goal_id = g.id 
      JOIN students s ON g.student_id = s.id 
      ORDER BY l.created_at DESC LIMIT 5
    `);

    return {
      student_count: (studentCount.rows[0] as any).count,
      active_goals: (activeGoals.rows[0] as any).count,
      logs_this_week: (logsThisWeek.rows[0] as any).count,
      recent_logs: recentLogs.rows,
    };
  },

  exportBackup: async () => {
    const db = await getDB();
    const now = new Date().toISOString();

    await db.query("UPDATE settings SET last_backup_at = $1 WHERE id = 1", [
      now,
    ]);

    const students = await db.query("SELECT * FROM students");
    const goals = await db.query("SELECT * FROM goals");
    const logs = await db.query("SELECT * FROM tracking_logs");
    const settings = await db.query("SELECT * FROM settings");
    const customGoals = await db.query("SELECT * FROM custom_goals");

    return JSON.stringify({
      version: 1,
      exported_at: now,
      students: students.rows,
      goals: goals.rows,
      logs: logs.rows,
      settings: settings.rows,
      custom_goals: customGoals.rows,
    });
  },

  restoreBackup: async (jsonString: string) => {
    const db = await getDB();
    try {
      const data = JSON.parse(jsonString);
      await db.exec("BEGIN");
      await db.exec("DELETE FROM tracking_logs");
      await db.exec("DELETE FROM goals");
      await db.exec("DELETE FROM students");
      await db.exec("DELETE FROM settings");
      await db.exec("DELETE FROM custom_goals");

      if (data.settings && data.settings.length > 0) {
        const s = data.settings[0];
        await db.query(
          "INSERT INTO settings (id, teacher_name, school_name, privacy_pin, theme, last_backup_at) VALUES (1, $1, $2, $3, $4, $5)",
          [
            s.teacher_name,
            s.school_name,
            s.privacy_pin,
            s.theme,
            s.last_backup_at,
          ]
        );
      } else {
        await db.exec("INSERT INTO settings (id) VALUES (1)");
      }

      for (const s of data.students) {
        const grade = s.grade || "K";
        const classType = s.class_type || "General Ed";
        await db.query(
          "INSERT INTO students (id, name, student_id, grade, class_type, iep_date, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [s.id, s.name, s.student_id, grade, classType, s.iep_date, s.active]
        );
      }

      for (const g of data.goals) {
        await db.query(
          `INSERT INTO goals (id, student_id, subject, description, active, mastery_enabled, mastery_score, mastery_count, frequency) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            g.id,
            g.student_id,
            g.subject,
            g.description,
            g.active,
            g.mastery_enabled,
            g.mastery_score,
            g.mastery_count,
            g.frequency,
          ]
        );
      }

      for (const l of data.logs) {
        await db.query(
          `INSERT INTO tracking_logs (id, goal_id, log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, notes, tester_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            l.id,
            l.goal_id,
            l.log_date,
            l.score,
            l.prompt_level,
            l.manipulatives_used,
            l.manipulatives_type,
            l.compliance,
            l.behavior,
            l.time_spent,
            l.notes,
            l.tester_name,
          ]
        );
      }

      if (data.custom_goals) {
        for (const c of data.custom_goals) {
          await db.query(
            "INSERT INTO custom_goals (subject, text) VALUES ($1, $2)",
            [c.subject, c.text]
          );
        }
      }

      await db.exec(`
        SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
        SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals));
        SELECT setval('tracking_logs_id_seq', (SELECT MAX(id) FROM tracking_logs));
        SELECT setval('custom_goals_id_seq', (SELECT MAX(id) FROM custom_goals));
      `);

      await db.exec("COMMIT");
      return true;
    } catch (e) {
      await db.exec("ROLLBACK");
      console.error("Restore failed", e);
      throw e;
    }
  },

  resetDatabase: async () => {
    const db = await getDB();
    await db.exec(`
      DELETE FROM tracking_logs;
      DELETE FROM goals;
      DELETE FROM students;
      DELETE FROM custom_goals;
    `);
  },
};
