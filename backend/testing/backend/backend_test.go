package backend_test

import (
	"SpotLight/backend/src/database"
	"bytes"
	"encoding/json"
	"github.com/joho/godotenv"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// setupTestDB initializes the test database connection
func setupTestDB(t *testing.T) (*database.DBInterface, *bool) {
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

	// Track if the test created the user
	userCreated := false

	return db, &userCreated
}

// cleanupTestData removes test users **at the end of each test**
func cleanupTestData(db *database.DBInterface, userCreated *bool, t *testing.T) {
	if *userCreated {
		err := db.DeleteUser("testUser")
		if err != nil {
			t.Logf("Warning: Failed to delete test user: %v", err)
		}
	}
}

// TestRegisterEndpoint verifies user registration via API
func TestRegisterEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	requestBody := `{"username":"testUser","password":"password"}`
	req := httptest.NewRequest("POST", "/api/register", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	db.HandleRegister(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}

	*userCreated = true
}

// TestLoginEndpoint verifies user login via API
func TestLoginEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	requestBody := `{"username":"testUser","password":"password"}`
	req := httptest.NewRequest("POST", "/api/login", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	db.HandleLogin(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}
}

// TestCreatePostEndpoint verifies post creation via API
func TestCreatePostEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	if err := db.Login("testUser", "password"); err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	postBody, err := json.Marshal(map[string]interface{}{
		"content":   "Hello, API!",
		"latitude":  37.7749,
		"longitude": -122.4194,
	})
	if err != nil {
		t.Fatalf("Failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(postBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	db.HandlePosts(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}
}

// TestGetPostsEndpoint verifies retrieving posts via API
func TestGetPostsEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	req := httptest.NewRequest("GET", "/api/posts", nil)
	rec := httptest.NewRecorder()

	db.HandlePosts(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	var posts []map[string]interface{}
	err := json.NewDecoder(rec.Body).Decode(&posts)
	if err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}
}
