package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// DBInterface manages database interactions.
type DBInterface struct {
	conn          *pgx.Conn
	currentUserID int
}

// NewDBInterface initializes a new DBInterface instance.
func NewDBInterface() (*DBInterface, error) {
	// Load environment variables.
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found. Using system environment variables.")
	} else {
		log.Println(".env file found.")
	}

	// Get the database URL from the environment.
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	// Connect to Postgres.
	conn, err := pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	return &DBInterface{conn: conn}, nil
}

// Close closes the database connection.
func (db *DBInterface) Close() {
	if db.conn != nil {
		err := db.conn.Close(context.Background())
		if err != nil {
			log.Printf("Error closing database connection: %v", err)
		}
	}
}

// Register creates a new user with the provided username and password.
func (db *DBInterface) Register(username, password string) error {
	// Hash the password.
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return fmt.Errorf("internal server error")
	}

	// Insert the new user into the database.
	_, err = db.conn.Exec(context.Background(), "INSERT INTO users (username, password_hash) VALUES ($1, $2)", username, string(hashedPassword))
	if err != nil {
		log.Printf("Error registering user: %v", err)
		return fmt.Errorf("failed to register user")
	}

	fmt.Println("User registered successfully!")
	return nil
}

// Login authenticates the user and sets the current session.
func (db *DBInterface) Login(username, password string) error {
	var userID int
	var storedHash string

	// Retrieve user credentials from the database.
	err := db.conn.QueryRow(context.Background(), "SELECT id, password_hash FROM users WHERE username=$1", username).Scan(&userID, &storedHash)
	if err != nil {
		log.Printf("Login failed for user %s: %v", username, err)
		return fmt.Errorf("invalid username or password")
	}

	// Verify the provided password against the stored hash.
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		log.Println("Incorrect password attempt")
		return fmt.Errorf("invalid username or password")
	}

	// Set the current user ID.
	db.currentUserID = userID
	fmt.Println("Login successful!")
	return db.ViewPosts()
}

// ViewPosts retrieves and displays all posts from the database.
func (db *DBInterface) ViewPosts() error {
	rows, err := db.conn.Query(context.Background(), "SELECT p.id, u.username, p.content, p.created_at FROM posts p JOIN users u ON p.user_id = u.id")
	if err != nil {
		log.Printf("Error retrieving posts: %v", err)
		return fmt.Errorf("failed to retrieve posts")
	}
	defer rows.Close()

	fmt.Println("Posts:")
	for rows.Next() {
		var id int
		var username, content string
		var createdAt time.Time
		err = rows.Scan(&id, &username, &content, &createdAt)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		fmt.Printf("ID: %d | User: %s | Content: %s | Created At: %s\n", id, username, content, createdAt.Format("2006-01-02 15:04:05"))
	}

	// Check for errors that may have occurred during iteration.
	if err = rows.Err(); err != nil {
		log.Printf("Error iterating over rows: %v", err)
		return fmt.Errorf("error processing posts")
	}

	return nil
}

// DeleteUser removes a user and all their posts
func (db *DBInterface) DeleteUser(username string) error {
	// Start a transaction for consistency
	tx, err := db.conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(context.Background()) // Ensure rollback if commit fails

	// Delete all posts by the user first
	_, err = tx.Exec(context.Background(), "DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE username=$1)", username)
	if err != nil {
		return fmt.Errorf("failed to delete posts for user %s: %w", username, err)
	}

	// Delete the user
	_, err = tx.Exec(context.Background(), "DELETE FROM users WHERE username=$1", username)
	if err != nil {
		return fmt.Errorf("failed to delete user %s: %w", username, err)
	}

	// Commit transaction
	err = tx.Commit(context.Background())
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("User '%s' and their posts deleted successfully.", username)
	return nil
}

// DeletePost removes a specific post by ID
func (db *DBInterface) DeletePost(postID int) error {
	_, err := db.conn.Exec(context.Background(), "DELETE FROM posts WHERE id=$1", postID)
	if err != nil {
		return fmt.Errorf("failed to delete post ID %d: %w", postID, err)
	}

	log.Printf("Post ID %d deleted successfully.", postID)
	return nil
}

func (db *DBInterface) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := db.Register(req.Username, req.Password)
	if err != nil {
		http.Error(w, "User registration failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

func (db *DBInterface) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := db.Login(req.Username, req.Password)
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}

func (db *DBInterface) HandlePosts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		// JOIN posts with users to get usernames
		rows, err := db.conn.Query(context.Background(), `
			SELECT p.id, u.username, p.content, p.latitude, p.longitude, p.created_at
			FROM posts p
			JOIN users u ON p.user_id = u.id
			ORDER BY p.created_at DESC`)
		if err != nil {
			log.Printf("Error retrieving posts: %v", err)
			http.Error(w, "Failed to retrieve posts", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []map[string]interface{}
		for rows.Next() {
			var postID int
			var username, content string
			var latitude, longitude float64
			var createdAt time.Time

			if err := rows.Scan(&postID, &username, &content, &latitude, &longitude, &createdAt); err != nil {
				log.Printf("Error scanning post row: %v", err)
				continue
			}

			posts = append(posts, map[string]interface{}{
				"post_id":    postID,
				"username":   username, // Now returning username instead of user_id
				"content":    content,
				"latitude":   latitude,
				"longitude":  longitude,
				"created_at": createdAt.Format(time.RFC3339),
			})
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)

	case "POST":
		// Handle creating a post
		var req struct {
			// UserID    int     `json:"user_id"`
			Content   string  `json:"content"`
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		_, err := db.conn.Exec(context.Background(),
			"INSERT INTO posts (user_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)",
			// req.UserID, req.Content, req.Latitude, req.Longitude)
			db.currentUserID, req.Content, req.Latitude, req.Longitude)
		if err != nil {
			log.Printf("Error creating post: %v", err)
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Post created successfully"})
	}
}

// getLocation retrieves the user's location using an external API.
func getLocation() (float64, float64, error) {
	resp, err := http.Get("http://ip-api.com/json/")
	if err != nil {
		log.Printf("Error fetching location: %v", err)
		return 0.0, 0.0, fmt.Errorf("could not determine location")
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var result struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Error decoding location response: %v", err)
		return 0.0, 0.0, fmt.Errorf("failed to parse location data")
	}

	return result.Lat, result.Lon, nil
}

// Post creates a new post for the logged-in user.
func (db *DBInterface) Post(content string) error {
	if db.currentUserID == 0 {
		log.Println("Unauthorized post attempt")
		return fmt.Errorf("you must log in to create a post")
	}

	// Get the user's location.
	latitude, longitude, err := getLocation()
	if err != nil {
		log.Println("Error determining location, using (0, 0) as fallback.")
		latitude, longitude = 0.0, 0.0
	}

	// Insert the new post into the database.
	_, err = db.conn.Exec(context.Background(),
		"INSERT INTO posts (user_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)",
		db.currentUserID, content, latitude, longitude)
	if err != nil {
		log.Printf("Error creating post: %v", err)
		return fmt.Errorf("failed to create post")
	}

	fmt.Printf("Posted from location (%f, %f)!\n", latitude, longitude)
	return nil
}
