package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"goal-app/models"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

// --- STRUCT DEFINITIONS ---

type SystemStatus struct {
	IsSetup bool `json:"is_setup"`
}

type UserResponse struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type UpdateRoleRequest struct {
	Role string `json:"role"`
}

// --- HELPERS ---

func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// --- HANDLERS ---

// 1. SETUP: First Run Admin Creation
func (repo *Repository) SetupAdmin(w http.ResponseWriter, r *http.Request) {
	var count int
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		http.Error(w, "System already initialized", http.StatusForbidden)
		return
	}

	var req models.LoginRequest
	json.NewDecoder(r.Body).Decode(&req)

	bytes, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)

	_, err := repo.DB.Exec(context.Background(), "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')", req.Email, string(bytes))
	if err != nil {
		http.Error(w, "Error creating admin", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Admin setup complete"}`))
}

// 2. ADMIN: Create an Invite Link
func (repo *Repository) CreateInvite(w http.ResponseWriter, r *http.Request) {
	token := generateToken()
	_, err := repo.DB.Exec(context.Background(), "INSERT INTO invitations (token, role) VALUES ($1, 'assistant')", token)
	if err != nil {
		http.Error(w, "Failed to create invite", 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// 3. PUBLIC: Verify Invite
func (repo *Repository) VerifyInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var role string
	var used bool
	err := repo.DB.QueryRow(context.Background(), "SELECT role, used FROM invitations WHERE token=$1", token).Scan(&role, &used)

	if err != nil || used {
		http.Error(w, "Invalid or expired invite", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"role": role, "valid": "true"})
}

// 4. PUBLIC: Complete Registration
func (repo *Repository) RegisterWithInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")

	var role string
	var used bool
	err := repo.DB.QueryRow(context.Background(), "SELECT role, used FROM invitations WHERE token=$1", token).Scan(&role, &used)
	if err != nil || used {
		http.Error(w, "Invalid invite", 400)
		return
	}

	var req models.LoginRequest
	json.NewDecoder(r.Body).Decode(&req)
	bytes, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)

	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(), "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)", req.Email, string(bytes), role)
	if err != nil {
		http.Error(w, "Email already in use", 400)
		return
	}
	tx.Exec(context.Background(), "UPDATE invitations SET used = true WHERE token = $1", token)

	tx.Commit(context.Background())

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Account created"}`))
}

// 5. Login
func (repo *Repository) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	json.NewDecoder(r.Body).Decode(&req)

	var user models.User
	var role string
	err := repo.DB.QueryRow(context.Background(), "SELECT id, email, password_hash, role FROM users WHERE email = $1", req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &role)
	if err != nil {
		http.Error(w, "Invalid credentials", 401)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", 401)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "logged_in",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})

	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful", "role": role})
}

// 6. Get System Status
func (repo *Repository) GetSystemStatus(w http.ResponseWriter, r *http.Request) {
	var count int
	err := repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SystemStatus{IsSetup: count > 0})
}

// 7. Logout
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

// 8. Check Auth
func (repo *Repository) CheckAuth(w http.ResponseWriter, r *http.Request) {
	_, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"authenticated": true}`))
}

// --- USER MANAGEMENT HANDLERS ---

// GetUsers lists all users (Admin only)
func (repo *Repository) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := repo.DB.Query(context.Background(), "SELECT id, email, role FROM users ORDER BY id ASC")
	if err != nil {
		http.Error(w, "Database error", 500)
		return
	}
	defer rows.Close()

	users := []UserResponse{}
	for rows.Next() {
		var u UserResponse
		rows.Scan(&u.ID, &u.Email, &u.Role)
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}

// UpdateUserRole changes a user's role (Admin only)
func (repo *Repository) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateRoleRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Role != "admin" && req.Role != "assistant" {
		http.Error(w, "Invalid role", 400)
		return
	}

	// Safety: If demoting to assistant, ensure at least one other admin remains
	if req.Role == "assistant" {
		var adminCount int
		repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users WHERE role='admin'").Scan(&adminCount)
		
		var targetRole string
		repo.DB.QueryRow(context.Background(), "SELECT role FROM users WHERE id=$1", id).Scan(&targetRole)

		// If this is the LAST admin, block demotion
		if targetRole == "admin" && adminCount <= 1 {
			http.Error(w, "Cannot demote the last admin", 400)
			return
		}
	}

	_, err := repo.DB.Exec(context.Background(), "UPDATE users SET role=$1 WHERE id=$2", req.Role, id)
	if err != nil {
		http.Error(w, "Failed to update role", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Role updated"}`))
}

// DeleteUser removes a user (Admin only)
func (repo *Repository) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Safety: Cannot delete the last admin
	var adminCount int
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users WHERE role='admin'").Scan(&adminCount)

	var targetRole string
	repo.DB.QueryRow(context.Background(), "SELECT role FROM users WHERE id=$1", id).Scan(&targetRole)

	if targetRole == "admin" && adminCount <= 1 {
		http.Error(w, "Cannot delete the last admin", 400)
		return
	}

	_, err := repo.DB.Exec(context.Background(), "DELETE FROM users WHERE id=$1", id)
	if err != nil {
		http.Error(w, "Failed to delete user", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "User deleted"}`))
}