package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"goal-app/handlers"
)

const schema = `
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    subject TEXT NOT NULL,
    iep_date DATE NOT NULL,
    description TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    mastery_score INTEGER DEFAULT 80,
    mastery_count INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    privacy_pin TEXT,
    full_name TEXT,
    school_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_logs (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES goals(id),
    user_id INTEGER REFERENCES users(id), -- NEW: Track who logged it
    log_date DATE NOT NULL,
    score TEXT,
    prompt_level TEXT,
    manipulatives_used BOOLEAN,
    manipulatives_type TEXT,
    compliance TEXT,
    behavior TEXT,
    time_spent TEXT,
	notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations (
    token TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);
`

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "postgres://admin:securepassword123@localhost:5432/goalmaster"
	}

	dbPool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer dbPool.Close()

	log.Println("Connected to PostgreSQL successfully.")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = dbPool.Exec(ctx, schema)
	if err != nil {
		log.Fatalf("Failed to create schema: %v\n", err)
	}
	log.Println("Database schema initialized.")

	repo := handlers.NewRepository(dbPool)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005",
			"http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003", "http://127.0.0.1:3004", "http://127.0.0.1:3005",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Cache-Control", "Pragma"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Goal Master API is running securely."))
	})

	r.Get("/api/status", repo.GetSystemStatus)
	r.Post("/api/setup", repo.SetupAdmin)
	r.Post("/api/login", repo.Login)
	r.Post("/api/logout", repo.Logout)
	r.Get("/api/invites/{token}", repo.VerifyInvite)
	r.Post("/api/invites/{token}", repo.RegisterWithInvite)

	r.Group(func(r chi.Router) {
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, err := r.Cookie("auth_token")
				if err != nil {
					http.Error(w, "Unauthorized access", http.StatusUnauthorized)
					return
				}
				var count int
				err = dbPool.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
				if err == nil && count == 0 {
					http.SetCookie(w, &http.Cookie{Name: "auth_token", Value: "", Expires: time.Now().Add(-1 * time.Hour), Path: "/", HttpOnly: true})
					http.Error(w, "Session invalid - System reset", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
			})
		})

		r.Route("/api", func(r chi.Router) {
			r.Get("/check-auth", repo.CheckAuth)
			r.Get("/user/profile", repo.GetUserProfile)
			r.Put("/user/profile", repo.UpdateUserProfile)
			r.Get("/user/pin", repo.GetPinStatus)
			r.Post("/user/pin", repo.SetUserPin)
			r.Delete("/user/pin", repo.RemoveUserPin)
			r.Post("/user/verify-pin", repo.VerifyUserPin)

			r.Post("/invites", repo.CreateInvite)
			r.Get("/users", repo.GetUsers)
			r.Put("/users/{id}/role", repo.UpdateUserRole)
			r.Delete("/users/{id}", repo.DeleteUser)
			r.Delete("/reset", repo.ResetDatabase)

			r.Post("/students", repo.CreateStudent)
			r.Get("/students", repo.GetStudents)
			r.Put("/students/{id}", repo.UpdateStudent)
			r.Delete("/students/{id}", repo.DeleteStudent)

			r.Post("/goals", repo.CreateGoal)
			r.Get("/goals", repo.GetGoals)
			r.Get("/goals/{id}", repo.GetGoal)
			r.Put("/goals/{id}", repo.UpdateGoal)
			r.Delete("/goals/{id}", repo.DeleteGoal)
			r.Get("/goals/{id}/export", repo.ExportGoalLogs)

			r.Post("/logs", repo.CreateLog)
			r.Get("/logs", repo.GetLogs)
			r.Put("/logs/{id}", repo.UpdateLog)
			r.Delete("/logs/{id}", repo.DeleteLog)

			r.Get("/stats", repo.GetDashboardStats)
			r.Get("/backup", repo.ExportBackup)
			r.Post("/restore", repo.RestoreBackup)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("Server starting on port :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}