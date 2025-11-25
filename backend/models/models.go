package models

import "time"

type Student struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	StudentID string    `json:"student_id"`
	Active    bool      `json:"active"`
}

type Goal struct {
	ID           int       `json:"id"`
	StudentID    int       `json:"student_id"`
	Subject      string    `json:"subject"`
	IEPDate      time.Time `json:"iep_date"`
	Description  string    `json:"description"`
	Active       bool      `json:"active"`
	MasteryScore int       `json:"mastery_score"` // New: e.g. 80
	MasteryCount int       `json:"mastery_count"` // New: e.g. 3
}

// CreateStudentRequest defines what we expect from the Frontend
type CreateStudentRequest struct {
	Name      string `json:"name"`
	StudentID string `json:"student_id"`
}

// CreateGoalRequest defines what we expect when adding a goal
type CreateGoalRequest struct {
	StudentID    int    `json:"student_id"`
	Subject      string `json:"subject"`
	IEPDate      string `json:"iep_date"` // Received as string "YYYY-MM-DD"
	Description  string `json:"description"`
	MasteryScore int    `json:"mastery_score"` // New
	MasteryCount int    `json:"mastery_count"` // New
}

type TrackingLog struct {
	ID                int       `json:"id"`
	GoalID            int       `json:"goal_id"`
	LogDate           time.Time `json:"log_date"`
	Score             string    `json:"score"`
	PromptLevel       string    `json:"prompt_level"`
	ManipulativesUsed bool      `json:"manipulatives_used"`
	ManipulativesType string    `json:"manipulatives_type"`
	Compliance        string    `json:"compliance"`
	Behavior          string    `json:"behavior"`
	TimeSpent         string    `json:"time_spent"`
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
	PasswordHash string `json:"-"`
	Role         string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}