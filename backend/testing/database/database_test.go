package database_test

import (
	"testing"

	"SpotLight/backend/src/database"
)

// setupTestDB initializes the test database connection
func setupTestDB(t *testing.T) *database.DBInterface {
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	return db
}

// cleanupTestData removes test users at the end of each test
func cleanupTestData(db *database.DBInterface, t *testing.T) {
	err := db.DeleteUser("testUser")
	if err != nil {
		t.Logf("Warning: Failed to delete test user: %v", err)
	}
}

// TestNewDBInterface verifies the database connection initializes correctly
func TestNewDBInterface(t *testing.T) {
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()
}

// TestRegister verifies user registration
func TestRegister(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
}

// TestAuthenticate verifies user authentication and retrieval of user_id
func TestAuthenticate(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Authentication failed: %v", err)
	}

	if userID == 0 {
		t.Fatalf("User ID should not be 0 after authentication")
	}
}

// TestPost verifies that a logged-in user can create a post
func TestPost(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	if err := db.CreatePost(userID, "Test post", 37.7749, -122.4194); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}
}

// TestDeleteUser verifies user deletion and cleanup of their posts
func TestDeleteUser(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	if err := db.CreatePost(userID, "First test post", 37.7749, -122.4194); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}

	if err := db.CreatePost(userID, "Second test post", 37.7749, -122.4194); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}

	if err := db.DeleteUser("testUser"); err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}

	userID, err = db.Authenticate("testUser", "password")
	if err == nil {
		t.Fatalf("User should have been deleted but can still log in")
	}
}

// TestCloseDB ensures the database connection closes properly
func TestCloseDB(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
}
