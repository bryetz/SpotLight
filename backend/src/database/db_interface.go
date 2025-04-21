package database

import (
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"github.com/jackc/pgx/v4/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// DBInterface handles database interactions
type DBInterface struct {
	pool *pgxpool.Pool
}

// UserProfile holds public user information
type UserProfile struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at"`
}

// NewDBInterface initializes the database connection
func NewDBInterface() (*DBInterface, error) {
	err := godotenv.Load()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	// Create a connection pool
	pool, err := pgxpool.Connect(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	return &DBInterface{pool: pool}, nil
}

// Close closes the database connection pool
func (db *DBInterface) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}

// Register creates a new user
func (db *DBInterface) Register(username, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("password hashing failed: %w", err)
	}

	_, err = db.pool.Exec(context.Background(),
		"INSERT INTO users (username, password_hash) VALUES ($1, $2)", username, string(hashedPassword))
	if err != nil {
		return fmt.Errorf("failed to register user: %w", err)
	}

	return nil
}

// Authenticate checks user credentials and returns the user ID
func (db *DBInterface) Authenticate(username, password string) (int, error) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var userID int
	var storedHash string

	err := db.pool.QueryRow(ctx,
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
	tx, err := db.pool.Begin(context.Background())
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

// Get username from the id
func (db *DBInterface) GetUserNameId(id int) (string, error) {
	var id_ int = -1
	var userName string = ""
	var hash string = ""
	var createdAt time.Time
	err := db.pool.QueryRow(context.Background(), "SELECT * FROM users WHERE id = $1", id).Scan(&id_, &userName, &hash, &createdAt)
	if err != nil {
		//fmt.Println("failed to get username from ID %d: %w", id, err)
		return "", err
	}
	return userName, nil
}

// CreatePost adds a new post
func (db *DBInterface) CreatePost(userID int, content string, latitude, longitude float64) error {
	_, err := db.pool.Exec(context.Background(),
		"INSERT INTO posts (user_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)",
		userID, content, latitude, longitude)
	if err != nil {
		return fmt.Errorf("failed to create post: %w", err)
	}
	return nil
}

// CreatePost adds a new post
func (db *DBInterface) CreatePostFile(userID int, content string, latitude, longitude float64, fileName string) error {
	_, err := db.pool.Exec(context.Background(),
		"INSERT INTO posts (user_id, content, latitude, longitude, file_name) VALUES ($1, $2, $3, $4, $5)",
		userID, content, latitude, longitude, fileName)
	if err != nil {
		fmt.Println("here err in creating post file")
		fmt.Println(err)
		return fmt.Errorf("failed to create post: %w", err)
	}

	return nil
}

// GetPosts retrieves posts with optional filtering and pagination
func (db *DBInterface) GetPosts(reqLatitude float64, reqLongitude float64, distance int,
	limit int, offset int, sortOrder string, timeFilter string) ([]map[string]interface{}, error) {
	if distance < 0 {
		distance = 25000 // Default distance if not provided or invalid
	}

	var queryBuilder strings.Builder
	var args []interface{}
	paramIndex := 1 // Parameter index for SQL query placeholders

	// Base query
	queryBuilder.WriteString(`SELECT p.id, p.user_id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.file_name, p.like_count
							  FROM posts p
							  JOIN users u ON p.user_id = u.id`)

	// WHERE clauses
	whereClauses := []string{}

	// Location filter
	if !(math.IsInf(reqLatitude, 1) || math.IsInf(reqLongitude, 1)) {
		whereClauses = append(whereClauses, fmt.Sprintf(`( 6371000 * acos(
							cos(radians($%d)) * cos(radians(p.latitude)) *
							cos(radians(p.longitude) - radians($%d)) +
							sin(radians($%d)) * sin(radians(p.latitude))
						) ) < $%d`, paramIndex, paramIndex+1, paramIndex, paramIndex+2))
		args = append(args, reqLatitude, reqLongitude, distance)
		paramIndex += 3
	}

	// Time filter
	now := time.Now()
	switch timeFilter {
	case "today":
		whereClauses = append(whereClauses, fmt.Sprintf("p.created_at >= DATE_TRUNC('day', $%d::timestamp)", paramIndex))
		args = append(args, now)
		paramIndex++
	case "week":
		whereClauses = append(whereClauses, fmt.Sprintf("p.created_at >= DATE_TRUNC('week', $%d::timestamp)", paramIndex))
		args = append(args, now)
		paramIndex++
	case "month":
		whereClauses = append(whereClauses, fmt.Sprintf("p.created_at >= DATE_TRUNC('month', $%d::timestamp)", paramIndex))
		args = append(args, now)
		paramIndex++
		// "all" is default, no time clause needed
	}

	if len(whereClauses) > 0 {
		queryBuilder.WriteString(" WHERE ")
		queryBuilder.WriteString(strings.Join(whereClauses, " AND "))
	}

	// ORDER BY clause
	queryBuilder.WriteString(" ORDER BY ")
	switch sortOrder {
	case "top":
		queryBuilder.WriteString("p.like_count DESC, p.created_at DESC")
	// case "hot": // Placeholder for future hot sort implementation
	// 	 queryBuilder.WriteString("...")
	case "new":
		fallthrough // Explicit fallthrough for clarity
	default: // Default to new
		queryBuilder.WriteString("p.created_at DESC")
	}

	// Pagination clause
	queryBuilder.WriteString(fmt.Sprintf(" LIMIT $%d OFFSET $%d", paramIndex, paramIndex+1))
	args = append(args, limit, offset)

	finalQuery := queryBuilder.String()
	// log.Printf("Executing query: %s with args: %v", finalQuery, args)

	rows, err := db.pool.Query(context.Background(), finalQuery, args...)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return nil, fmt.Errorf("failed to retrieve posts: %w", err)
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var postID int
		var userID int
		var username, content, filename string
		var latitude, longitude float64
		var createdAt time.Time
		var likeCount int

		if err := rows.Scan(&postID, &userID, &username, &content, &latitude, &longitude, &createdAt, &filename, &likeCount); err != nil {
			log.Printf("Error scanning post row: %v", err)
			continue
		}

		posts = append(posts, map[string]interface{}{
			"post_id":    postID,
			"user_id":    userID,
			"username":   username,
			"content":    content,
			"latitude":   latitude,
			"longitude":  longitude,
			"created_at": createdAt.Format(time.RFC3339),
			"file_name":  filename,
			"like_count": likeCount,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating post results: %w", err)
	}

	return posts, nil
}

// GetUserPosts gets profile info and all posts from a specific user
func (db *DBInterface) GetUserPosts(userId int) (UserProfile, []map[string]interface{}, error) {
	var userProfile UserProfile
	var posts []map[string]interface{}

	// 1. Get User Profile Info
	var createdAt time.Time
	err := db.pool.QueryRow(context.Background(),
		"SELECT id, username, created_at FROM users WHERE id = $1", userId).Scan(
		&userProfile.UserID, &userProfile.Username, &createdAt)
	if err != nil {
		log.Printf("Failed to get user profile for ID %d: %v", userId, err)
		return userProfile, posts, fmt.Errorf("user not found: %w", err)
	}
	userProfile.CreatedAt = createdAt.Format(time.RFC3339)

	// 2. Get User Posts
	query := `
		SELECT p.id, p.user_id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.file_name, p.like_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.user_id = $1
		ORDER BY p.created_at DESC`

	rows, err := db.pool.Query(context.Background(), query, userId)
	if err != nil {
		log.Printf("Failed to get posts for user ID %d: %v", userId, err)
		return userProfile, posts, fmt.Errorf("failed to retrieve posts for user ID %d: %w", userId, err)
	}
	defer rows.Close()

	for rows.Next() {
		var postID int
		var postUserID int // Renamed to avoid conflict with outer userId
		var username, content, filename string
		var latitude, longitude float64
		var postCreatedAt time.Time // Renamed for clarity
		var likeCount int

		if err := rows.Scan(&postID, &postUserID, &username, &content, &latitude, &longitude, &postCreatedAt, &filename, &likeCount); err != nil {
			log.Printf("Error scanning post row for user ID %d: %v", userId, err)
			continue
		}
		posts = append(posts, map[string]interface{}{
			"post_id":    postID,
			"user_id":    postUserID, // Use the scanned user ID
			"username":   username,   // Use the scanned username
			"content":    content,
			"latitude":   latitude,
			"longitude":  longitude,
			"created_at": postCreatedAt.Format(time.RFC3339), // Use the scanned time
			"file_name":  filename,
			"like_count": likeCount,
		})
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating through post rows for user ID %d: %v", userId, err)
		return userProfile, posts, fmt.Errorf("error processing posts for user ID %d: %w", userId, err)
	}

	return userProfile, posts, nil
}

// GetPostById gets a post by ID
func (db *DBInterface) GetPostById(postId int) (map[string]interface{}, error) {
	var post map[string]interface{}
	// Updated Query: Join posts and users tables, select specific columns including username
	query := `
		SELECT p.id, p.user_id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.file_name, p.like_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = $1`

	rows, err := db.pool.Query(context.Background(), query, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to query post with ID %d: %w", postId, err)
	}
	defer rows.Close()

	if rows.Next() {
		var postID int
		var userID int
		var username, content, filename string
		var latitude, longitude float64
		var createdAt time.Time
		var likeCount int

		// Scan
		if err := rows.Scan(&postID, &userID, &username, &content, &latitude, &longitude, &createdAt, &filename, &likeCount); err != nil {
			log.Printf("Error scanning post row for ID %d: %v", postId, err)
			return nil, fmt.Errorf("failed to scan post data for ID %d: %w", postId, err)
		}

		post = map[string]interface{}{
			"post_id":    postID,
			"user_id":    userID,
			"username":   username,
			"content":    content,
			"latitude":   latitude,
			"longitude":  longitude,
			"created_at": createdAt.Format(time.RFC3339),
			"file_name":  filename,
			"like_count": likeCount,
		}
	} else {
		if err := rows.Err(); err != nil {
			log.Printf("Error iterating rows for post ID %d: %v", postId, err)
			return nil, fmt.Errorf("error retrieving post data for ID %d: %w", postId, err)
		}
		return nil, fmt.Errorf("post with ID %d not found", postId)
	}

	// Check if there were more rows than expected (shouldn't happen)
	if rows.Next() {
		log.Printf("Warning: Multiple posts found for ID %d", postId)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error after iterating rows for post ID %d: %v", postId, err)
		return nil, fmt.Errorf("error completing retrieval for post ID %d: %w", postId, err)
	}

	return post, nil
}

func (db *DBInterface) InsertMessage(senderID, receiverID int, content string) error {
	_, err := db.pool.Exec(context.Background(),
		"INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
		senderID, receiverID, content)
	return err
}

func (db *DBInterface) GetMessages(senderID, receiverID int) ([]map[string]interface{}, error) {
	rows, err := db.pool.Query(context.Background(), `
		SELECT id, sender_id, receiver_id, content, created_at 
		FROM messages 
		WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
		ORDER BY created_at ASC`, senderID, receiverID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []map[string]interface{}
	for rows.Next() {
		var id, sID, rID int
		var content string
		var createdAt time.Time
		if err := rows.Scan(&id, &sID, &rID, &content, &createdAt); err != nil {
			continue
		}
		messages = append(messages, map[string]interface{}{
			"id":          id,
			"sender_id":   sID,
			"receiver_id": rID,
			"content":     content,
			"created_at":  createdAt.Format(time.RFC3339),
		})
	}
	return messages, nil
}

// helper function to get last postId from userId
func (db *DBInterface) GetLastPostByUser(userId int) (int, error) {
	row, err := db.pool.Query(context.Background(), "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", userId)
	if err != nil {
		return -1, fmt.Errorf("failed to get last user post from ID %d: %w", userId, err)
	}
	var pId int = -1
	for row.Next() {
		var postID int
		var userID int
		var content, filename string
		var latitude, longitude float64
		var createdAt time.Time
		var likeCount int
		if err := row.Scan(&postID, &userID, &content, &latitude, &longitude, &createdAt, &filename, &likeCount); err != nil {
			log.Printf("Error scanning post row: %v", err)
			return -1, err
		}
		pId = postID
	}
	return pId, nil
}

// DeletePost removes a post by ID
func (db *DBInterface) DeletePost(postID int) error {
	_, err := db.pool.Exec(context.Background(), "DELETE FROM posts WHERE id=$1", postID)
	if err != nil {
		return fmt.Errorf("failed to delete post ID %d: %w", postID, err)
	}
	return nil
}

// LikePost registers a like
func (db *DBInterface) LikePost(userID, postID int) error {
	var exists bool
	err := db.pool.QueryRow(context.Background(),
		"SELECT EXISTS (SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2)", userID, postID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check like existence: %w", err)
	}
	if exists {
		return fmt.Errorf("post already liked by this user")
	}

	tx, err := db.pool.Begin(context.Background())
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
	err := db.pool.QueryRow(context.Background(),
		"SELECT EXISTS (SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2)", userID, postID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check like existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("post not liked by this user")
	}

	tx, err := db.pool.Begin(context.Background())
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
	rows, err := db.pool.Query(context.Background(),
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

// GetPostLikes returns simple bool check if provided user liked provided post
func (db *DBInterface) CheckUserLikedPost(postID int, userID int) (bool, error) {
	rows, err := db.pool.Query(context.Background(),
		`SELECT u.username FROM post_likes pl
		 JOIN users u ON pl.user_id = u.id
		 WHERE pl.post_id = $1 AND pl.user_id = $2`, postID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to get likes: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var username string
		if err := rows.Scan(&username); err != nil {
			return false, fmt.Errorf("failed to scan username: %w", err)
		}
		return true, nil
	}
	return false, nil
}

type Comment struct {
	ID        int        `json:"comment_id"`
	UserID    int        `json:"user_id"`
	Username  string     `json:"username"`
	Content   string     `json:"content"`
	CreatedAt string     `json:"created_at"`
	Replies   []*Comment `json:"replies,omitempty"`
	ParentID  *int       `json:"parent_id,omitempty"`
}

// GetNestedComments returns comments on a post and all their replies
func (db *DBInterface) GetNestedComments(postID int) ([]*Comment, error) {
	rows, err := db.pool.Query(context.Background(), `
		SELECT c.id, c.user_id, u.username, c.content, c.created_at, c.parent_id
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	commentMap := make(map[int]*Comment)
	var roots []*Comment

	for rows.Next() {
		var c Comment
		var createdAt time.Time
		var parentID *int
		if err := rows.Scan(&c.ID, &c.UserID, &c.Username, &c.Content, &createdAt, &parentID); err != nil {
			log.Printf("Error scanning comment row: %v", err)
			continue
		}
		c.CreatedAt = createdAt.Format(time.RFC3339)
		c.ParentID = parentID
		commentMap[c.ID] = &c
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating comment rows: %v", err)
		return nil, err
	}

	for _, comment := range commentMap {
		if comment.ParentID != nil {
			parent := commentMap[*comment.ParentID]
			parent.Replies = append(parent.Replies, comment)
		} else {
			roots = append(roots, comment)
		}
	}

	return roots, nil
}

// CreateNestedComment creates a comment on a post with support for replies
func (db *DBInterface) CreateNestedComment(postID, userID int, parentID *int, content string) error {
	_, err := db.pool.Exec(context.Background(),
		"INSERT INTO comments (post_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4)",
		postID, userID, parentID, content)
	return err
}

func (db *DBInterface) DeleteComment(commentID int) error {
	_, err := db.pool.Exec(context.Background(),
		"DELETE FROM comments WHERE id=$1", commentID)
	return err
}

// SearchUsers finds users by username (case-insensitive)
func (db *DBInterface) SearchUsers(query string, limit int) ([]UserProfile, error) {
	var users []UserProfile
	sqlQuery := `
		SELECT id, username, created_at 
		FROM users 
		WHERE username ILIKE $1 
		ORDER BY username ASC 
		LIMIT $2`

	rows, err := db.pool.Query(context.Background(), sqlQuery, "%"+query+"%", limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var user UserProfile
		var createdAt time.Time
		if err := rows.Scan(&user.UserID, &user.Username, &createdAt); err != nil {
			log.Printf("Error scanning user row during search: %v", err)
			continue
		}
		user.CreatedAt = createdAt.Format(time.RFC3339) // Format timestamp
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user search results: %w", err)
	}

	return users, nil
}

// SearchPosts finds posts by content (case-insensitive)
func (db *DBInterface) SearchPosts(query string, limit int) ([]map[string]interface{}, error) {
	var posts []map[string]interface{}
	sqlQuery := `
		SELECT p.id, p.user_id, u.username, p.content, p.latitude, p.longitude, p.created_at, p.file_name, p.like_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.content ILIKE $1
		ORDER BY p.created_at DESC
		LIMIT $2`

	rows, err := db.pool.Query(context.Background(), sqlQuery, "%"+query+"%", limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search posts: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var postID int
		var userID int
		var username, content, filename string
		var latitude, longitude float64
		var createdAt time.Time
		var likeCount int

		if err := rows.Scan(&postID, &userID, &username, &content, &latitude, &longitude, &createdAt, &filename, &likeCount); err != nil {
			log.Printf("Error scanning post row during search: %v", err)
			continue
		}

		posts = append(posts, map[string]interface{}{
			"post_id":    postID,
			"user_id":    userID,
			"username":   username,
			"content":    content,
			"latitude":   latitude,
			"longitude":  longitude,
			"created_at": createdAt.Format(time.RFC3339),
			"file_name":  filename,
			"like_count": likeCount,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating post search results: %w", err)
	}

	return posts, nil
}
