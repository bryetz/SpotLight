package database

import (
	"context"
	"fmt"
	"github.com/joho/godotenv"
	"log"
	"math"
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

// GetPosts retrieves posts within a given distance (meters)
func (db *DBInterface) GetPosts(reqLatitude float64, reqLongitude float64, distance int) ([]map[string]interface{}, error) {
	if distance < 0 {
		distance = 25000
	}

	var query string
	if math.IsInf(reqLatitude, 1) || math.IsInf(reqLongitude, 1) {
		query = `SELECT p.id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.like_count
				 FROM posts p
				 JOIN users u ON p.user_id = u.id
				 ORDER BY p.created_at DESC;`
	} else {
		query = fmt.Sprintf(`
			SELECT p.id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.like_count
			FROM posts p
			JOIN users u ON p.user_id = u.id
			WHERE ( 6371000 * acos(
					cos(radians(%f)) * cos(radians(p.latitude)) *
					cos(radians(p.longitude) - radians(%f)) +
					sin(radians(%f)) * sin(radians(p.latitude))
				) ) < %d
			ORDER BY p.created_at DESC;`, reqLatitude, reqLongitude, reqLatitude, distance)
	}

	rows, err := db.conn.Query(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve posts: %w", err)
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var postID int
		var username, content string
		var latitude, longitude float64
		var createdAt time.Time
		var likeCount int

		if err := rows.Scan(&postID, &username, &content, &latitude, &longitude, &createdAt, &likeCount); err != nil {
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
			"like_count": likeCount,
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

// LikePost registers a like
func (db *DBInterface) LikePost(userID, postID int) error {
	var exists bool
	err := db.conn.QueryRow(context.Background(),
		"SELECT EXISTS (SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2)", userID, postID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check like existence: %w", err)
	}
	if exists {
		return fmt.Errorf("post already liked by this user")
	}

	tx, err := db.conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		"INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)", userID, postID)
	if err != nil {
		return fmt.Errorf("failed to insert like: %w", err)
	}

	_, err = tx.Exec(context.Background(),
		"UPDATE posts SET like_count = like_count + 1 WHERE id=$1", postID)
	if err != nil {
		return fmt.Errorf("failed to update like count: %w", err)
	}

	return tx.Commit(context.Background())
}

// UnlikePost removes a like
func (db *DBInterface) UnlikePost(userID, postID int) error {
	var exists bool
	err := db.conn.QueryRow(context.Background(),
		"SELECT EXISTS (SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2)", userID, postID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check like existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("post not liked by this user")
	}

	tx, err := db.conn.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		"DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2", userID, postID)
	if err != nil {
		return fmt.Errorf("failed to delete like: %w", err)
	}

	_, err = tx.Exec(context.Background(),
		"UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id=$1", postID)
	if err != nil {
		return fmt.Errorf("failed to update like count: %w", err)
	}

	return tx.Commit(context.Background())
}

// GetPostLikes returns usernames who liked a post
func (db *DBInterface) GetPostLikes(postID int) ([]string, error) {
	rows, err := db.conn.Query(context.Background(),
		`SELECT u.username FROM post_likes pl
		 JOIN users u ON pl.user_id = u.id
		 WHERE pl.post_id = $1`, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get likes: %w", err)
	}
	defer rows.Close()

	var usernames []string
	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			return nil, fmt.Errorf("failed to scan username: %w", err)
		}
		usernames = append(usernames, username)
	}
	return usernames, nil
}
