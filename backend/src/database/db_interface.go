package database

import (
	"context"
	"fmt"
	"github.com/joho/godotenv"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v4"
	"golang.org/x/crypto/bcrypt"
)

// DBInterface handles database interactions
type DBInterface struct {
	conn *pgx.Conn
}

// NewDBInterface initializes the database connection
func NewDBInterface() (*DBInterface, error) {
	err := godotenv.Load()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	conn, err := pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &DBInterface{conn: conn}, nil
}

// Close closes the database connection
func (db *DBInterface) Close() {
	if err := db.conn.Close(context.Background()); err != nil {
		log.Printf("Error closing database: %v", err)
	}
}

// Register creates a new user
func (db *DBInterface) Register(username, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("password hashing failed: %w", err)
	}

	_, err = db.conn.Exec(context.Background(),
		"INSERT INTO users (username, password_hash) VALUES ($1, $2)", username, string(hashedPassword))
	if err != nil {
		return fmt.Errorf("failed to register user: %w", err)
	}

	return nil
}

// Authenticate checks user credentials and returns the user ID
func (db *DBInterface) Authenticate(username, password string) (int, error) {
	var userID int
	var storedHash string

	err := db.conn.QueryRow(context.Background(),
		"SELECT id, password_hash FROM users WHERE username=$1", username).Scan(&userID, &storedHash)
	if err != nil {
		log.Printf("User authentication failed for username: %s", username)
		return 0, fmt.Errorf("invalid credentials")
	}

	if bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)) != nil {
		log.Println("Incorrect password attempt")
		return 0, fmt.Errorf("invalid credentials")
	}

	return userID, nil
}

// DeleteUser removes a user and their posts
func (db *DBInterface) DeleteUser(username string) error {
	tx, err := db.conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(), "DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE username=$1)", username)
	if err != nil {
		return fmt.Errorf("failed to delete user posts: %w", err)
	}

	_, err = tx.Exec(context.Background(), "DELETE FROM users WHERE username=$1", username)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if err = tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("transaction commit failed: %w", err)
	}

	return nil
}

// CreatePost adds a new post
func (db *DBInterface) CreatePost(userID int, content string, latitude, longitude float64) error {
	_, err := db.conn.Exec(context.Background(),
		"INSERT INTO posts (user_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)",
		userID, content, latitude, longitude)
	if err != nil {
		return fmt.Errorf("failed to create post: %w", err)
	}

	return nil
}

// GetPosts retrieves all posts
func (db *DBInterface) GetPosts() ([]map[string]interface{}, error) {
	rows, err := db.conn.Query(context.Background(),
		"SELECT p.id, u.username, p.content, p.latitude, p.longitude, p.created_at FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC")
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
		// until we get data from the request body specifying both location of request and distance perferred,
		// we will arbitrarily compare server location and not show posts beyond 15 kilometers
		// the query is based on the Haversine formula to approx earth as a sphere instead of ellipse
		lat, long, err := getLocation() // location of server instead of user for now...
		if err != nil {
			fmt.Println(err)
		}
		var distance int = 15000 // arbitrary cutoff distance in meters to stop showing posts far away
		var getQuery string = fmt.Sprintf(`
		SELECT p.id, u.username, p.content, p.latitude, p.longitude, p.created_at
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE ( 6371000 * acos(
				cos(radians(%f)) * cos(radians(p.latitude)) *
				cos(radians(p.longitude) - radians(%f)) +
				sin(radians(%f)) * sin(radians(p.latitude))
			) ) <= %d
		ORDER BY p.created_at DESC;`, lat, long, lat, distance)

		/* // feel free to add this as an additional column in the response to show how far the post is from the user!
		( 6371000 * acos(
			cos(radians(%f)) * cos(radians(p.latitude)) *
			cos(radians(p.longitude) - radians(%f)) +
			sin(radians(%f)) * sin(radians(p.latitude))
		) ) AS distance_meters
		*/
		// also could order by smallest distance assuming we incorporate above
		// ORDER BY distance_meters ASC, p.created_at DESC;

		rows, err := db.conn.Query(context.Background(), getQuery)
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
			"username":   username,
			"content":    content,
			"latitude":   latitude,
			"longitude":  longitude,
			"created_at": createdAt.Format(time.RFC3339),
		})
	}

	return posts, nil
}

// DeletePost removes a post by ID
func (db *DBInterface) DeletePost(postID int) error {
	_, err := db.conn.Exec(context.Background(), "DELETE FROM posts WHERE id=$1", postID)
	if err != nil {
		return fmt.Errorf("failed to delete post ID %d: %w", postID, err)
	}

	return nil
}
