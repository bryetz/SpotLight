package backend_test

import (
	"SpotLight/backend/src/database"
	"SpotLight/backend/src/handler"
	"bytes"
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"
)

func extractPostID(t *testing.T, raw interface{}) int {
	t.Helper()
	switch v := raw.(type) {
	case float64:
		return int(v)
	case int:
		return v
	default:
		t.Fatalf("Unexpected post_id type: %T", v)
		return 0
	}
}

// setupTestDB initializes the test database connection
func setupTestDB(t *testing.T) (*database.DBInterface, *bool) {
	t.Helper()
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	userCreated := false
	return db, &userCreated
}

// cleanupTestData removes test users at the end of each test
func cleanupTestData(db *database.DBInterface, userCreated *bool, t *testing.T) {
	t.Helper()
	if *userCreated {
		err := db.DeleteUser("testUser")
		if err != nil {
			t.Logf("Warning: Failed to delete test user: %v", err)
		}
	}
}

// alternative cleanup removes test users at the end of each test
func cleanupTestDataAll(db *database.DBInterface, fm *database.FileManager, userCreated *bool, t *testing.T) {
	t.Helper()
	if *userCreated {
		err := db.DeleteUser("testUser")
		if err != nil {
			t.Logf("Warning: Failed to delete test user: %v", err)
		}
		err = fm.DeleteUserFolder("testUser")
		if err != nil {
			t.Logf("Warning: Failed to delete test user folder: %v", err)
		}
	}
}

func setupLikeTest(t *testing.T) (*database.DBInterface, *handler.RequestHandler, int, int, *bool) {
	db, userCreated := setupTestDB(t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}
	*userCreated = true

	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate test user: %v", err)
	}

	if err := db.CreatePost(userID, "Post for testing likes", 1.0, 1.0); err != nil {
		t.Fatalf("Failed to create test post: %v", err)
	}

	posts, err := db.GetPosts(0, 0, math.MaxInt)
	if err != nil || len(posts) == 0 {
		t.Fatalf("Failed to retrieve posts: %v", err)
	}
	postID := extractPostID(t, posts[0]["post_id"])

	return db, &handler.RequestHandler{DB: db}, userID, postID, userCreated
}

func TestLikePost(t *testing.T) {
	db, handlerInstance, userID, postID, userCreated := setupLikeTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	reqBody := map[string]int{"user_id": userID, "post_id": postID}
	jsonBody, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/api/posts/like", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance.HandleLikePost(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK on like, got %d", rec.Code)
	}
}

func TestDoubleLikePost(t *testing.T) {
	db, handlerInstance, userID, postID, userCreated := setupLikeTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	// First like
	body := map[string]int{"user_id": userID, "post_id": postID}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/posts/like", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handlerInstance.HandleLikePost(rec, req)

	// Second like (should fail)
	rec2 := httptest.NewRecorder()
	handlerInstance.HandleLikePost(rec2, req)

	if rec2.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 BadRequest on double-like, got %d", rec2.Code)
	}
}

func TestUnlikePost(t *testing.T) {
	db, handlerInstance, userID, postID, userCreated := setupLikeTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	body := map[string]int{"user_id": userID, "post_id": postID}
	jsonBody, _ := json.Marshal(body)

	// Like first
	likeReq := httptest.NewRequest("POST", "/api/posts/like", bytes.NewBuffer(jsonBody))
	likeReq.Header.Set("Content-Type", "application/json")
	likeRec := httptest.NewRecorder()
	handlerInstance.HandleLikePost(likeRec, likeReq)

	// Then unlike
	unlikeReq := httptest.NewRequest("POST", "/api/posts/unlike", bytes.NewBuffer(jsonBody))
	unlikeReq.Header.Set("Content-Type", "application/json")
	unlikeRec := httptest.NewRecorder()
	handlerInstance.HandleUnlikePost(unlikeRec, unlikeReq)

	if unlikeRec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK on unlike, got %d", unlikeRec.Code)
	}
}

func TestDoubleUnlikePost(t *testing.T) {
	db, handlerInstance, userID, postID, userCreated := setupLikeTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	body := map[string]int{"user_id": userID, "post_id": postID}
	jsonBody, _ := json.Marshal(body)

	// Attempt to unlike before liking
	unlikeReq := httptest.NewRequest("POST", "/api/posts/unlike", bytes.NewBuffer(jsonBody))
	unlikeReq.Header.Set("Content-Type", "application/json")
	unlikeRec := httptest.NewRecorder()
	handlerInstance.HandleUnlikePost(unlikeRec, unlikeReq)

	if unlikeRec.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 BadRequest on unliking a post not yet liked, got %d", unlikeRec.Code)
	}
}
