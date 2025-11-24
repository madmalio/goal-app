package models

import "time"

type Student struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	StudentID string    `json:"student_id"`
	Active    bool      `json:"active"`
}

type Goal struct {
	ID          int       `json:"id"`
	StudentID   int       `json:"student_id"`
	Subject     string    `json:"subject"`
	IEPDate     time.Time `json:"iep_date"`
	Description string    `json:"description"`
	Active      bool      `json:"active"` // <--- This was missing!
}

// CreateStudentRequest defines what we expect from the Frontend
type CreateStudentRequest struct {
	Name      string `json:"name"`
	StudentID string `json:"student_id"`
}

// CreateGoalRequest defines what we expect when adding a goal
type CreateGoalRequest struct {
	StudentID   int    `json:"student_id"`
	Subject     string `json:"subject"`
	IEPDate     string `json:"iep_date"` // Received as string "YYYY-MM-DD", converted later
	Description string `json:"description"`
}

type TrackingLog struct {
	ID                int       `json:"id"`
	GoalID            int       `json:"goal_id"`
	LogDate           time.Time `json:"log_date"`           // PDF: "Date"
	Score             string    `json:"score"`              // PDF: "Score"
	PromptLevel       string    `json:"prompt_level"`       // PDF: "Prompts"
	ManipulativesUsed bool      `json:"manipulatives_used"` // PDF: "Did they use manipulatives?"
	ManipulativesType string    `json:"manipulatives_type"` // PDF: "visual aid, counters, tracing"
	Compliance        string    `json:"compliance"`         // PDF: "Compliance"
	Behavior          string    `json:"behavior"`           // PDF: "Behavior Response"
	TimeSpent         string    `json:"time_spent"`         // PDF: "Time spent on task"
	Notes             string    `json:"notes"`
}

type CreateLogRequest struct {
	GoalID            int    `json:"goal_id"`
	LogDate           string `json:"log_date"`
	Score             string `json:"score"`
	PromptLevel       string `json:"prompt_level"`
	ManipulativesUsed bool   `json:"manipulatives_used"`
	ManipulativesType string `json:"manipulatives_type"`
	Compliance        string `json:"compliance"`
	Behavior          string `json:"behavior"`
	TimeSpent         string `json:"time_spent"`
	Notes             string `json:"notes"`
}

type User struct {
    ID           int    `json:"id"`
    Email        string `json:"email"`
    PasswordHash string `json:"-"` // Never send hash to frontend
}

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}