package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"goal-app/models"

	"golang.org/x/crypto/bcrypt"
)

// Register creates the initial admin user
func (repo *Repository) RegisterUser(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Hash the password
	bytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	sql := `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`
	var newID int
	err = repo.DB.QueryRow(context.Background(), sql, req.Email, string(bytes)).Scan(&newID)
	if err != nil {
		http.Error(w, "User already exists or db error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "User created"}`))
}

// Login checks credentials and sets a secure cookie
func (repo *Repository) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Get user from DB
	var user models.User
	sql := `SELECT id, email, password_hash FROM users WHERE email = $1`
	err := repo.DB.QueryRow(context.Background(), sql, req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Compare Password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Set A Simple Session Cookie (For a real school app, use JWTs or Sessions, this is basic)
	// We basically say "If this cookie exists, they are logged in"
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "logged_in", // In production, this should be a signed token
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true, // JavaScript cannot access this (Security)
		Path:     "/",
	})

	w.Write([]byte(`{"message": "Login successful"}`))
}

// Logout clears the cookie
func (repo *Repository) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	w.Write([]byte(`{"message": "Logged out"}`))
}

// CheckAuth checks if the user is logged in (Frontend calls this to see if it should redirect)
func (repo *Repository) CheckAuth(w http.ResponseWriter, r *http.Request) {
	_, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"authenticated": true}`))
}