package backend_test

import (
	"SpotLight/backend/src/database"
	"SpotLight/backend/src/handler"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gorilla/mux"
)

func setupCommentTest(t *testing.T) (*database.DBInterface, *handler.RequestHandler, int, int, *bool) {
	db, userCreated := setupTestDB(t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}
	*userCreated = true

	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate test user: %v", err)
	}

	if err := db.CreatePost(userID, "Test post for comments", 0.0, 0.0); err != nil {
		t.Fatalf("Failed to create post: %v", err)
	}

	posts, err := db.GetPosts(0, 0, -1, 20, 0, "", "")
	if err != nil || len(posts) == 0 {
		t.Fatalf("Failed to retrieve posts: %v", err)
	}
	postID := extractPostID(t, posts[0]["post_id"])

	return db, &handler.RequestHandler{DB: db}, userID, postID, userCreated
}

func TestCreateTopLevelComment(t *testing.T) {
	db, h, userID, postID, userCreated := setupCommentTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	comment := map[string]interface{}{
		"user_id": userID,
		"content": "Top-level comment",
	}
	jsonBody, _ := json.Marshal(comment)

	req := httptest.NewRequest("POST", "/api/posts/"+strconv.Itoa(postID)+"/comments", bytes.NewBuffer(jsonBody))
	req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(postID)})
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.HandleCreateComment(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}
}

func TestCreateReplyComment(t *testing.T) {
	db, h, userID, postID, userCreated := setupCommentTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	// Create top-level comment
	top := map[string]interface{}{
		"user_id": userID,
		"content": "Parent comment",
	}
	topJSON, _ := json.Marshal(top)
	topReq := httptest.NewRequest("POST", "/api/posts/"+strconv.Itoa(postID)+"/comments", bytes.NewBuffer(topJSON))
	topReq = mux.SetURLVars(topReq, map[string]string{"id": strconv.Itoa(postID)})
	topReq.Header.Set("Content-Type", "application/json")
	topRec := httptest.NewRecorder()
	h.HandleCreateComment(topRec, topReq)

	if topRec.Code != http.StatusOK {
		t.Fatalf("Failed to create top-level comment: %d", topRec.Code)
	}

	comments, err := db.GetNestedComments(postID)
	if err != nil || len(comments) == 0 {
		t.Fatalf("No top-level comment found")
	}
	parentID := comments[0].ID

	// Reply to top-level comment
	reply := map[string]interface{}{
		"user_id":   userID,
		"content":   "Reply to comment",
		"parent_id": parentID,
	}
	replyJSON, _ := json.Marshal(reply)
	replyReq := httptest.NewRequest("POST", "/api/posts/"+strconv.Itoa(postID)+"/comments", bytes.NewBuffer(replyJSON))
	replyReq = mux.SetURLVars(replyReq, map[string]string{"id": strconv.Itoa(postID)})
	replyReq.Header.Set("Content-Type", "application/json")
	replyRec := httptest.NewRecorder()
	h.HandleCreateComment(replyRec, replyReq)

	if replyRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for reply, got %d", replyRec.Code)
	}
}

func TestGetNestedComments(t *testing.T) {
	db, h, userID, postID, userCreated := setupCommentTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	// Create a comment and a reply
	_ = db.CreateNestedComment(postID, userID, nil, "Top-level comment")
	comments, _ := db.GetNestedComments(postID)
	if len(comments) == 0 {
		t.Fatal("Expected 1 comment")
	}

	parentID := comments[0].ID
	_ = db.CreateNestedComment(postID, userID, &parentID, "Nested reply")

	req := httptest.NewRequest("GET", "/api/posts/"+strconv.Itoa(postID)+"/comments", nil)
	req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(postID)})
	rec := httptest.NewRecorder()

	h.HandleGetNestedComments(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}

	var result []map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode JSON: %v", err)
	}

	if len(result) != 1 {
		t.Errorf("Expected 1 top-level comment, got %d", len(result))
	}

	if replies, ok := result[0]["replies"].([]interface{}); !ok || len(replies) != 1 {
		t.Errorf("Expected 1 reply, got %#v", result[0]["replies"])
	}
}

func TestDeleteCommentAndReplies(t *testing.T) {
	db, h, userID, postID, userCreated := setupCommentTest(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	// Create parent comment
	if err := db.CreateNestedComment(postID, userID, nil, "Parent comment"); err != nil {
		t.Fatalf("Failed to create parent comment: %v", err)
	}
	comments, _ := db.GetNestedComments(postID)
	parentID := comments[0].ID

	// Create child comment
	if err := db.CreateNestedComment(postID, userID, &parentID, "Child comment"); err != nil {
		t.Fatalf("Failed to create child comment: %v", err)
	}

	// Delete parent
	req := httptest.NewRequest("DELETE", "/api/comments/"+strconv.Itoa(parentID), nil)
	req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(parentID)})
	rec := httptest.NewRecorder()
	h.HandleDeleteComment(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for deletion, got %d", rec.Code)
	}

	// Check that all comments are gone
	remaining, err := db.GetNestedComments(postID)
	if err != nil {
		t.Fatalf("Failed to fetch comments: %v", err)
	}
	if len(remaining) != 0 {
		t.Errorf("Expected 0 comments after deletion, got %d", len(remaining))
	}
}
