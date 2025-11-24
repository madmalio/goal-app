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

	// Update this if your module name in go.mod is different
	"goal-app/handlers"
)

// Define the Database Schema
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
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_logs (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES goals(id),
    log_date DATE NOT NULL,
    score TEXT,
    prompt_level TEXT,
    manipulatives_used BOOLEAN,
    manipulatives_type TEXT,
    compliance TEXT,
    behavior TEXT,
    time_spent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auth Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
`

func main() {
	// 1. Load Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	// 2. Database Configuration
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		// Fallback for local dev
		dbUrl = "postgres://admin:securepassword123@localhost:5432/goalmaster"
	}

	// 3. Connect to Database
	dbPool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer dbPool.Close()

	log.Println("Connected to PostgreSQL successfully.")

	// 4. Initialize Schema (Create tables if missing)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = dbPool.Exec(ctx, schema)
	if err != nil {
		log.Fatalf("Failed to create schema: %v\n", err)
	}
	log.Println("Database schema initialized.")

	// 5. Initialize Handlers
	repo := handlers.NewRepository(dbPool)

	// 6. Setup Router & Middleware
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Setup
	// We must specify the exact Origin (http://localhost:3000) for credentials/cookies to work.
	// Wildcard "*" is NOT allowed when AllowCredentials is true.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"}, // Content-Disposition needed for file downloads
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Goal Master API is running securely."))
	})

	// 7. API Routes
	
	// --- PUBLIC ROUTES (No Auth Required) ---
	r.Post("/api/register", repo.RegisterUser)
	r.Post("/api/login", repo.Login)
	r.Post("/api/logout", repo.Logout)

	// --- PROTECTED ROUTES (Auth Required) ---
	r.Group(func(r chi.Router) {
		// Middleware: Check for valid session cookie
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, err := r.Cookie("auth_token")
				if err != nil {
					http.Error(w, "Unauthorized access", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
			})
		})

		r.Route("/api", func(r chi.Router) {
			// Auth Check
			r.Get("/check-auth", repo.CheckAuth)
			
			// Students
			r.Post("/students", repo.CreateStudent)
			r.Get("/students", repo.GetStudents)
			r.Put("/students/{id}", repo.UpdateStudent) 
			r.Delete("/students/{id}", repo.DeleteStudent)
			
			
			// Goals
			r.Post("/goals", repo.CreateGoal)
			r.Get("/goals", repo.GetGoals)
			r.Get("/goals/{id}", repo.GetGoal)
			r.Put("/goals/{id}", repo.UpdateGoal)    
			r.Delete("/goals/{id}", repo.DeleteGoal)
			
			// Logs
			r.Post("/logs", repo.CreateLog)
			r.Get("/logs", repo.GetLogs)
			r.Put("/logs/{id}", repo.UpdateLog)
			r.Delete("/logs/{id}", repo.DeleteLog)
			
			// Dashboard Stats
			r.Get("/stats", repo.GetDashboardStats)

			// Data Management (Backup/Restore)
			r.Get("/backup", repo.ExportBackup)
			r.Post("/restore", repo.RestoreBackup)
		})
	})

	// 8. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default fallback
	}
	log.Printf("Server starting on port :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}