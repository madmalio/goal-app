package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"goal-app/models"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

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

type PinRequest struct {
	Pin string `json:"pin"`
}

func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// --- AUTH HANDLERS ---

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
	
	// Updated SQL to include full_name and school_name
	_, err := repo.DB.Exec(context.Background(), 
        "INSERT INTO users (email, password_hash, role, full_name, school_name) VALUES ($1, $2, 'admin', $3, $4)", 
        req.Email, string(bytes), req.FullName, req.SchoolName)
	
    if err != nil {
		http.Error(w, "Error creating admin", 500)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Admin setup complete"}`))
}

// ... (CreateInvite, VerifyInvite, RegisterWithInvite remain the same) ...
func (repo *Repository) CreateInvite(w http.ResponseWriter, r *http.Request) {
	token := generateToken()
	_, err := repo.DB.Exec(context.Background(), "INSERT INTO invitations (token, role) VALUES ($1, 'assistant')", token)
	if err != nil { http.Error(w, "Failed", 500); return }
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}
func (repo *Repository) VerifyInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var role string
	var used bool
	err := repo.DB.QueryRow(context.Background(), "SELECT role, used FROM invitations WHERE token=$1", token).Scan(&role, &used)
	if err != nil || used { http.Error(w, "Invalid", 404); return }
	json.NewEncoder(w).Encode(map[string]string{"role": role, "valid": "true"})
}
func (repo *Repository) RegisterWithInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var role string
	var used bool
	repo.DB.QueryRow(context.Background(), "SELECT role, used FROM invitations WHERE token=$1", token).Scan(&role, &used)
	if used { http.Error(w, "Invalid", 400); return }

	var req models.LoginRequest
	json.NewDecoder(r.Body).Decode(&req)
	bytes, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)

	tx, _ := repo.DB.Begin(context.Background())
	defer tx.Rollback(context.Background())

	_, err := tx.Exec(context.Background(), 
        "INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4)", 
        req.Email, string(bytes), role, req.FullName)
	
    if err != nil {
		http.Error(w, "Email already in use", 400)
		return
	}
	tx.Exec(context.Background(), "UPDATE invitations SET used = true WHERE token = $1", token)
	tx.Commit(context.Background())
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Account created"}`))
}

func (repo *Repository) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	json.NewDecoder(r.Body).Decode(&req)
	var user models.User
	var role string
	var pinHash *string 
	
	err := repo.DB.QueryRow(context.Background(), "SELECT id, email, password_hash, role, privacy_pin FROM users WHERE email = $1", req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &role, &pinHash)
	if err != nil { http.Error(w, "Invalid credentials", 401); return }
	
    err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil { http.Error(w, "Invalid credentials", 401); return }
	
	http.SetCookie(w, &http.Cookie{Name: "auth_token", Value: "logged_in", Expires: time.Now().Add(24 * time.Hour), HttpOnly: true, Path: "/"})
	http.SetCookie(w, &http.Cookie{Name: "user_id", Value: fmt.Sprintf("%d", user.ID), Expires: time.Now().Add(24 * time.Hour), HttpOnly: true, Path: "/"})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful", 
		"role": role,
		"has_pin": pinHash != nil,
	})
}

// --- PROFILE HANDLERS (NEW) ---

func (repo *Repository) GetUserProfile(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    if c == nil { http.Error(w, "User not identified", 401); return }

    var u models.User
    // Using COALESCE to return empty strings instead of NULLs if fields aren't set
    err := repo.DB.QueryRow(context.Background(), 
        "SELECT email, role, COALESCE(full_name, ''), COALESCE(school_name, '') FROM users WHERE id=$1", 
        c.Value).Scan(&u.Email, &u.Role, &u.FullName, &u.SchoolName)
    
    if err != nil { http.Error(w, "User not found", 404); return }
    
    json.NewEncoder(w).Encode(u)
}

func (repo *Repository) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    if c == nil { http.Error(w, "User not identified", 401); return }

    var req models.UpdateProfileRequest
    json.NewDecoder(r.Body).Decode(&req)

    _, err := repo.DB.Exec(context.Background(), 
        "UPDATE users SET full_name=$1, school_name=$2 WHERE id=$3", 
        req.FullName, req.SchoolName, c.Value)
    
    if err != nil { http.Error(w, "Update failed", 500); return }
    
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"message": "Profile updated"}`))
}

// ... (PIN, SystemStatus, Logout, etc. remain the same) ...
// COPY PIN HANDLERS FROM PREVIOUS STEP IF NEEDED, THEY DON'T CHANGE LOGIC
func (repo *Repository) GetPinStatus(w http.ResponseWriter, r *http.Request) {
	c, _ := r.Cookie("user_id")
	if c == nil { http.Error(w, "User not identified", 401); return }
	var pinHash *string
	err := repo.DB.QueryRow(context.Background(), "SELECT privacy_pin FROM users WHERE id=$1", c.Value).Scan(&pinHash)
	if err != nil { http.Error(w, "User not found", 404); return }
	json.NewEncoder(w).Encode(map[string]bool{"has_pin": pinHash != nil})
}
func (repo *Repository) SetUserPin(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    if c == nil { http.Error(w, "User not identified", 401); return }
    var req PinRequest
    json.NewDecoder(r.Body).Decode(&req)
    bytes, _ := bcrypt.GenerateFromPassword([]byte(req.Pin), 14)
    _, err := repo.DB.Exec(context.Background(), "UPDATE users SET privacy_pin=$1 WHERE id=$2", string(bytes), c.Value)
    if err != nil { http.Error(w, "Failed", 500); return }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"message": "Set"}`))
}
func (repo *Repository) RemoveUserPin(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    if c == nil { http.Error(w, "User not identified", 401); return }
    repo.DB.Exec(context.Background(), "UPDATE users SET privacy_pin=NULL WHERE id=$1", c.Value)
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"message": "Removed"}`))
}
func (repo *Repository) VerifyUserPin(w http.ResponseWriter, r *http.Request) {
    c, _ := r.Cookie("user_id")
    if c == nil { http.Error(w, "User not identified", 401); return }
    var req PinRequest
    json.NewDecoder(r.Body).Decode(&req)
    var hash string
    repo.DB.QueryRow(context.Background(), "SELECT privacy_pin FROM users WHERE id=$1", c.Value).Scan(&hash)
    if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Pin)) == nil {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`{"valid": true}`))
    } else {
        http.Error(w, "Invalid", 401)
    }
}
func (repo *Repository) GetSystemStatus(w http.ResponseWriter, r *http.Request) {
	var count int
	repo.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SystemStatus{IsSetup: count > 0})
}
func (repo *Repository) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "auth_token", Value: "", Expires: time.Now().Add(-1 * time.Hour), HttpOnly: true, Path: "/"})
	w.Write([]byte(`{"message": "Logged out"}`))
}
func (repo *Repository) CheckAuth(w http.ResponseWriter, r *http.Request) {
	_, err := r.Cookie("auth_token")
	if err != nil { http.Error(w, "Unauthorized", 401); return }
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"authenticated": true}`))
}
func (repo *Repository) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := repo.DB.Query(context.Background(), "SELECT id, email, role FROM users ORDER BY id ASC")
	if err != nil { http.Error(w, "Error", 500); return }
	defer rows.Close()
	users := []UserResponse{}
	for rows.Next() {
		var u UserResponse
		rows.Scan(&u.ID, &u.Email, &u.Role)
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}
func (repo *Repository) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateRoleRequest
	json.NewDecoder(r.Body).Decode(&req)
	repo.DB.Exec(context.Background(), "UPDATE users SET role=$1 WHERE id=$2", req.Role, id)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Updated"}`))
}
func (repo *Repository) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	repo.DB.Exec(context.Background(), "DELETE FROM users WHERE id=$1", id)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Deleted"}`))
}