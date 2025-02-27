package database_test

import (
	"testing"

	"SpotLight/backend/src/database"
	"github.com/joho/godotenv"
)

// setupTestDB initializes the test database connection
func setupTestDB(t *testing.T) *database.DBInterface {
	// Load .env manually before initializing the database
	err := godotenv.Load()
	if err != nil {
		t.Log("Warning: .env file not found. Using system environment variables.")
	}

	// Initialize database connection
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	return db
}

// cleanupTestData removes the test user and all their posts at the end of each test
func cleanupTestData(db *database.DBInterface, t *testing.T) {
	err := db.DeleteUser("testUser")
	if err != nil {
		t.Logf("Warning: Failed to delete test user: %v", err)
	}
}

// TestNewDBInterface ensures the database connection initializes correctly
func TestNewDBInterface(t *testing.T) {
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()
}

// TestRegister checks if a user can register successfully
func TestRegister(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
}

// TestLogin verifies that a registered user can log in
func TestLogin(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	if err := db.Login("testUser", "password"); err != nil {
		t.Fatalf("Login failed: %v", err)
	}
}

// TestPost checks if a logged-in user can create a post
func TestPost(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	if err := db.Login("testUser", "password"); err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	// Create a post
	err := db.Post("Test post")
	if err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}
}

// TestDeleteUser ensures a user and all their posts are deleted
func TestDeleteUser(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	// Register test user
	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	// Log in and create posts
	if err := db.Login("testUser", "password"); err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}
	if err := db.Post("First test post"); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}
	if err := db.Post("Second test post"); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}

	// Delete user (which should delete all posts)
	if err := db.DeleteUser("testUser"); err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}

	// Ensure user no longer exists by attempting login
	err := db.Login("testUser", "password")
	if err == nil {
		t.Fatalf("User should have been deleted but can still log in")
	}
}

// TestCloseDB ensures the database connection closes properly
func TestCloseDB(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
}
