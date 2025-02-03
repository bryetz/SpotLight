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
