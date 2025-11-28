package handlers

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"goal-app/models"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

// --- STUDENTS ---

func (repo *Repository) CreateStudent(w http.ResponseWriter, r *http.Request) {
	var req models.CreateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.StudentID == "" {
		http.Error(w, "Name and Student ID required", http.StatusBadRequest)
		return
	}
    
    date := time.Now()
    if req.IEPDate != "" {
        parsed, err := time.Parse("2006-01-02", req.IEPDate)
        if err == nil { date = parsed }
    }

	var newID int
	err := repo.DB.QueryRow(context.Background(), 
        "INSERT INTO students (name, student_id, iep_date) VALUES ($1, $2, $3) RETURNING id", 
        req.Name, req.StudentID, date).Scan(&newID)
        
	if err != nil {
		http.Error(w, "Error creating student", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"id": newID})
}

func (repo *Repository) GetStudents(w http.ResponseWriter, r *http.Request) {
	showArchived := r.URL.Query().Get("archived") == "true"
	targetActive := !showArchived

	rows, err := repo.DB.Query(context.Background(), "SELECT id, name, student_id, iep_date, active FROM students WHERE active = $1 ORDER BY name ASC", targetActive)
	if err != nil {
		http.Error(w, "Error fetching students", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	students := []models.Student{}
	for rows.Next() {
		var s models.Student
		rows.Scan(&s.ID, &s.Name, &s.StudentID, &s.IEPDate, &s.Active)
		students = append(students, s)
	}
	if students == nil { students = []models.Student{} }
	json.NewEncoder(w).Encode(students)
}

func (repo *Repository) UpdateStudent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct { Name string `json:"name"`; ID string `json:"student_id"`; IEPDate string `json:"iep_date"`; Active bool `json:"active"` }
	json.NewDecoder(r.Body).Decode(&req)
    
    date := time.Now()
    if req.IEPDate != "" {
        parsed, err := time.Parse("2006-01-02", req.IEPDate)
        if err == nil { date = parsed }
    }

	_, err := repo.DB.Exec(context.Background(), "UPDATE students SET name=$1, student_id=$2, iep_date=$3, active=$4 WHERE id=$5", req.Name, req.ID, date, req.Active, id)
	if err != nil {
		http.Error(w, "Error updating student", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Student updated"}`))
}

func (repo *Repository) DeleteStudent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())
	
	tx.Exec(context.Background(), "DELETE FROM tracking_logs WHERE goal_id IN (SELECT id FROM goals WHERE student_id = $1)", id)
	tx.Exec(context.Background(), "DELETE FROM goals WHERE student_id = $1", id)
	_, err := tx.Exec(context.Background(), "DELETE FROM students WHERE id = $1", id)
	
	if err != nil {
		http.Error(w, "Error deleting student", http.StatusInternalServerError)
		return
	}
	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Student deleted"}`))
}

// --- GOALS ---

func (repo *Repository) CreateGoal(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGoalRequest
	json.NewDecoder(r.Body).Decode(&req)
	
	if req.MasteryScore == 0 { req.MasteryScore = 80 }
	if req.MasteryCount == 0 { req.MasteryCount = 3 }
    if req.Frequency == "" { req.Frequency = "Weekly" }

	var newID int
    // UPDATED SQL with mastery_enabled
	err := repo.DB.QueryRow(context.Background(), "INSERT INTO goals (student_id, subject, description, mastery_enabled, mastery_score, mastery_count, frequency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id", req.StudentID, req.Subject, req.Description, req.MasteryEnabled, req.MasteryScore, req.MasteryCount, req.Frequency).Scan(&newID)
	if err != nil {
		http.Error(w, "Error creating goal", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"id": newID})
}

func (repo *Repository) GetGoals(w http.ResponseWriter, r *http.Request) {
	sid := r.URL.Query().Get("student_id")
    // UPDATED SQL with mastery_enabled
	rows, err := repo.DB.Query(context.Background(), "SELECT id, student_id, subject, description, active, mastery_enabled, mastery_score, mastery_count, frequency FROM goals WHERE student_id = $1 AND active = true ORDER BY created_at DESC", sid)
	if err != nil {
		http.Error(w, "Error fetching goals", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	goals := []models.Goal{}
	for rows.Next() {
		var g models.Goal
		rows.Scan(&g.ID, &g.StudentID, &g.Subject, &g.Description, &g.Active, &g.MasteryEnabled, &g.MasteryScore, &g.MasteryCount, &g.Frequency)
		goals = append(goals, g)
	}
	if goals == nil { goals = []models.Goal{} }
	json.NewEncoder(w).Encode(goals)
}

func (repo *Repository) GetGoal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var g struct { models.Goal; StudentName string `json:"student_name"`; StudentIDStr string `json:"student_id_str"`; StudentIEPDate time.Time `json:"iep_date"` }
	
    // UPDATED SQL with mastery_enabled
	err := repo.DB.QueryRow(context.Background(), `
		SELECT g.id, g.student_id, g.subject, g.description, g.active, g.mastery_enabled, g.mastery_score, g.mastery_count, g.frequency, s.name, s.student_id, s.iep_date
		FROM goals g JOIN students s ON g.student_id = s.id WHERE g.id = $1`, id).Scan(&g.ID, &g.StudentID, &g.Subject, &g.Description, &g.Active, &g.MasteryEnabled, &g.MasteryScore, &g.MasteryCount, &g.Frequency, &g.StudentName, &g.StudentIDStr, &g.StudentIEPDate)
	
	if err != nil {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(g)
}

func (repo *Repository) UpdateGoal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.CreateGoalRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.MasteryScore == 0 { req.MasteryScore = 80 }
	if req.MasteryCount == 0 { req.MasteryCount = 3 }
    if req.Frequency == "" { req.Frequency = "Weekly" }

    // UPDATED SQL with mastery_enabled
	_, err := repo.DB.Exec(context.Background(), "UPDATE goals SET subject=$1, description=$2, mastery_enabled=$3, mastery_score=$4, mastery_count=$5, frequency=$6 WHERE id=$7", req.Subject, req.Description, req.MasteryEnabled, req.MasteryScore, req.MasteryCount, req.Frequency, id)
	if err != nil {
		http.Error(w, "Error updating goal", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Goal updated"}`))
}

func (repo *Repository) DeleteGoal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())

	tx.Exec(context.Background(), "DELETE FROM tracking_logs WHERE goal_id = $1", id)
	_, err := tx.Exec(context.Background(), "DELETE FROM goals WHERE id = $1", id)
	
	if err != nil {
		http.Error(w, "Error deleting goal", http.StatusInternalServerError)
		return
	}
	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Goal deleted"}`))
}

// --- CSV EXPORT ---

func (repo *Repository) ExportGoalLogs(w http.ResponseWriter, r *http.Request) {
	goalID := chi.URLParam(r, "id")

	var meta struct { StudentName string; Subject string }
	err := repo.DB.QueryRow(context.Background(), `
		SELECT s.name, g.subject 
		FROM goals g 
		JOIN students s ON g.student_id = s.id 
		WHERE g.id = $1`, goalID).Scan(&meta.StudentName, &meta.Subject)
	
	if err != nil {
		http.Error(w, "Goal not found", 404)
		return
	}

	rows, err := repo.DB.Query(context.Background(), `
		SELECT log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, COALESCE(notes, '') 
		FROM tracking_logs 
		WHERE goal_id = $1 
		ORDER BY log_date DESC, created_at DESC`, goalID)
	
	if err != nil {
		http.Error(w, "Database error", 500)
		return
	}
	defer rows.Close()

	filename := fmt.Sprintf("%s_%s_Report.csv", meta.StudentName, meta.Subject)
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+filename+"\"")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	writer.Write([]string{"Date", "Score", "Prompts", "Used Manipulatives", "Manipulative Type", "Compliance", "Behavior", "Time Spent", "Notes"})

	for rows.Next() {
		var l models.TrackingLog
		rows.Scan(&l.LogDate, &l.Score, &l.PromptLevel, &l.ManipulativesUsed, &l.ManipulativesType, &l.Compliance, &l.Behavior, &l.TimeSpent, &l.Notes)
		
		usedManip := "No"
		if l.ManipulativesUsed {
			usedManip = "Yes"
		}

		writer.Write([]string{
			l.LogDate.Format("2006-01-02"),
			l.Score,
			l.PromptLevel,
			usedManip,
			l.ManipulativesType,
			l.Compliance,
			l.Behavior,
			l.TimeSpent,
			l.Notes,
		})
	}
}

// --- LOGS ---

func (repo *Repository) CreateLog(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    var userID string
    if c != nil { userID = c.Value }

	var req models.CreateLogRequest
	json.NewDecoder(r.Body).Decode(&req)
	date, _ := time.Parse("2006-01-02", req.LogDate)

	sql := `INSERT INTO tracking_logs (goal_id, user_id, log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`
	var newID int
	err := repo.DB.QueryRow(context.Background(), sql, req.GoalID, userID, date, req.Score, req.PromptLevel, req.ManipulativesUsed, req.ManipulativesType, req.Compliance, req.Behavior, req.TimeSpent, req.Notes).Scan(&newID)
	
	if err != nil {
		http.Error(w, "Error creating log: "+err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"id": newID})
}

func (repo *Repository) GetLogs(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("goal_id")
	sql := `
        SELECT l.id, l.goal_id, l.user_id, COALESCE(u.full_name, u.email, 'Unknown'), l.log_date, l.score, l.prompt_level, l.manipulatives_used, l.manipulatives_type, l.compliance, l.behavior, l.time_spent, COALESCE(l.notes, '') 
        FROM tracking_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.goal_id = $1 
        ORDER BY l.log_date DESC, l.created_at DESC
    `
	rows, err := repo.DB.Query(context.Background(), sql, gid)
	
	if err != nil {
		http.Error(w, "Error fetching logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	logs := []models.TrackingLog{}
	for rows.Next() {
		var l models.TrackingLog
		rows.Scan(&l.ID, &l.GoalID, &l.UserID, &l.TesterName, &l.LogDate, &l.Score, &l.PromptLevel, &l.ManipulativesUsed, &l.ManipulativesType, &l.Compliance, &l.Behavior, &l.TimeSpent, &l.Notes)
		logs = append(logs, l)
	}
	if logs == nil { logs = []models.TrackingLog{} }
	json.NewEncoder(w).Encode(logs)
}

func (repo *Repository) UpdateLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.CreateLogRequest
	json.NewDecoder(r.Body).Decode(&req)
	date, _ := time.Parse("2006-01-02", req.LogDate)

	sql := `UPDATE tracking_logs SET log_date=$1, score=$2, prompt_level=$3, manipulatives_used=$4, manipulatives_type=$5, compliance=$6, behavior=$7, time_spent=$8, notes=$9 WHERE id=$10`
	_, err := repo.DB.Exec(context.Background(), sql, date, req.Score, req.PromptLevel, req.ManipulativesUsed, req.ManipulativesType, req.Compliance, req.Behavior, req.TimeSpent, req.Notes, id)
	
	if err != nil {
		http.Error(w, "Error updating log", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Log updated"}`))
}

func (repo *Repository) DeleteLog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := repo.DB.Exec(context.Background(), "DELETE FROM tracking_logs WHERE id=$1", id)
	if err != nil {
		http.Error(w, "Error deleting log", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Log deleted"}`))
}

// --- DASHBOARD & BACKUP ---

func (repo *Repository) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	type DashboardData struct {
		StudentCount int `json:"student_count"`
		ActiveGoals  int `json:"active_goals"`
		LogsThisWeek int `json:"logs_this_week"`
		RecentLogs   []struct {
			StudentName string `json:"student_name"`; Subject string `json:"subject"`; Score string `json:"score"`; Date time.Time `json:"date"`; GoalID int `json:"goal_id"`; StudentID int `json:"student_id"`
		} `json:"recent_logs"`
	}
	var data DashboardData
	
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM students WHERE active = true").Scan(&data.StudentCount)
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM goals WHERE active = true").Scan(&data.ActiveGoals)
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM tracking_logs WHERE log_date >= NOW() - INTERVAL '7 days'").Scan(&data.LogsThisWeek)

	rows, _ := repo.DB.Query(context.Background(), `SELECT s.name, g.subject, l.score, l.log_date, l.goal_id, s.id FROM tracking_logs l JOIN goals g ON l.goal_id = g.id JOIN students s ON g.student_id = s.id ORDER BY l.created_at DESC LIMIT 5`)
	defer rows.Close()
	for rows.Next() {
		var l struct { StudentName string `json:"student_name"`; Subject string `json:"subject"`; Score string `json:"score"`; Date time.Time `json:"date"`; GoalID int `json:"goal_id"`; StudentID int `json:"student_id"` }
		rows.Scan(&l.StudentName, &l.Subject, &l.Score, &l.Date, &l.GoalID, &l.StudentID)
		data.RecentLogs = append(data.RecentLogs, l)
	}
	if data.RecentLogs == nil { data.RecentLogs = []struct{ StudentName string `json:"student_name"`; Subject string `json:"subject"`; Score string `json:"score"`; Date time.Time `json:"date"`; GoalID int `json:"goal_id"`; StudentID int `json:"student_id"` }{} }

	json.NewEncoder(w).Encode(data)
}

func (repo *Repository) ExportBackup(w http.ResponseWriter, r *http.Request) {
	type BackupData struct {
		Students []models.Student `json:"students"`; Goals []models.Goal `json:"goals"`; Logs []models.TrackingLog `json:"logs"`; ExportedAt time.Time `json:"exported_at"`
	}
	var data BackupData
	data.ExportedAt = time.Now()

	rows, _ := repo.DB.Query(context.Background(), "SELECT id, name, student_id, iep_date, active FROM students")
	for rows.Next() { var s models.Student; rows.Scan(&s.ID, &s.Name, &s.StudentID, &s.IEPDate, &s.Active); data.Students = append(data.Students, s) }
	rows.Close()

    // UPDATED SQL with mastery_enabled
	rows, _ = repo.DB.Query(context.Background(), "SELECT id, student_id, subject, description, active, mastery_enabled, mastery_score, mastery_count, frequency FROM goals")
	for rows.Next() { var g models.Goal; rows.Scan(&g.ID, &g.StudentID, &g.Subject, &g.Description, &g.Active, &g.MasteryEnabled, &g.MasteryScore, &g.MasteryCount, &g.Frequency); data.Goals = append(data.Goals, g) }
	rows.Close()

	rows, _ = repo.DB.Query(context.Background(), "SELECT id, goal_id, user_id, log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, COALESCE(notes, '') FROM tracking_logs")
	for rows.Next() { var l models.TrackingLog; rows.Scan(&l.ID, &l.GoalID, &l.UserID, &l.LogDate, &l.Score, &l.PromptLevel, &l.ManipulativesUsed, &l.ManipulativesType, &l.Compliance, &l.Behavior, &l.TimeSpent, &l.Notes); data.Logs = append(data.Logs, l) }
	rows.Close()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=backup.json")
	json.NewEncoder(w).Encode(data)
}

func (repo *Repository) RestoreBackup(w http.ResponseWriter, r *http.Request) {
	type BackupData struct { Students []models.Student; Goals []models.Goal; Logs []models.TrackingLog }
	var data BackupData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil { http.Error(w, "Invalid JSON", 400); return }

	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())
	ctx := context.Background()

	tx.Exec(ctx, "DELETE FROM tracking_logs"); tx.Exec(ctx, "DELETE FROM goals"); tx.Exec(ctx, "DELETE FROM students");
	for _, s := range data.Students { tx.Exec(ctx, "INSERT INTO students (id, name, student_id, iep_date, active) VALUES ($1, $2, $3, $4, $5)", s.ID, s.Name, s.StudentID, s.IEPDate, s.Active) }
    // UPDATED SQL with mastery_enabled
	for _, g := range data.Goals { tx.Exec(ctx, "INSERT INTO goals (id, student_id, subject, description, active, mastery_enabled, mastery_score, mastery_count, frequency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", g.ID, g.StudentID, g.Subject, g.Description, g.Active, g.MasteryEnabled, g.MasteryScore, g.MasteryCount, g.Frequency) }
	for _, l := range data.Logs { tx.Exec(ctx, "INSERT INTO tracking_logs (id, goal_id, user_id, log_date, score, prompt_level, manipulatives_used, manipulatives_type, compliance, behavior, time_spent, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)", l.ID, l.GoalID, l.UserID, l.LogDate, l.Score, l.PromptLevel, l.ManipulativesUsed, l.ManipulativesType, l.Compliance, l.Behavior, l.TimeSpent, l.Notes) }

	tx.Exec(ctx, "SELECT setval('students_id_seq', (SELECT MAX(id) FROM students))")
	tx.Exec(ctx, "SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals))")
	tx.Exec(ctx, "SELECT setval('tracking_logs_id_seq', (SELECT MAX(id) FROM tracking_logs))")

	tx.Commit(ctx)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Database restored"}`))
}

func (repo *Repository) ResetDatabase(w http.ResponseWriter, r *http.Request) {
	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())
	_, err := tx.Exec(context.Background(), "TRUNCATE TABLE tracking_logs, goals, students RESTART IDENTITY CASCADE")
	if err != nil { http.Error(w, "Failed to wipe data", 500); return }
	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Database wiped successfully"}`))
}