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
)

// setupDMTestDB initializes the test database and ensures both DM users are cleaned up afterward
func setupDMTestDB(t *testing.T) (*database.DBInterface, *bool) {
	t.Helper()
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	userCreated := false
	return db, &userCreated
}

// cleanupDMTestData removes test users used for DM tests
func cleanupDMTestData(db *database.DBInterface, t *testing.T) {
	t.Helper()
	for _, username := range []string{"testUser", "testReceiver"} {
		if err := db.DeleteUser(username); err != nil {
			t.Logf("Warning: Failed to delete user %s: %v", username, err)
		}
	}
}

func TestSendDMEndpoint(t *testing.T) {
	db, _ := setupDMTestDB(t)
	defer db.Close()
	defer cleanupDMTestData(db, t)

	// Setup both users
	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register testUser: %v", err)
	}
	if err := db.Register("testReceiver", "password"); err != nil {
		t.Fatalf("Failed to register testReceiver: %v", err)
	}

	senderID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testUser: %v", err)
	}
	receiverID, err := db.Authenticate("testReceiver", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testReceiver: %v", err)
	}

	handlerInstance := handler.RequestHandler{DB: db}

	body, _ := json.Marshal(map[string]interface{}{
		"sender_id":   senderID,
		"receiver_id": receiverID,
		"content":     "Hi from testUser to testReceiver!",
	})

	req := httptest.NewRequest("POST", "/api/dm/send", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance.HandleSendDM(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}
}

func TestGetDMHistoryEndpoint(t *testing.T) {
	db, _ := setupDMTestDB(t)
	defer db.Close()
	defer cleanupDMTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register testUser: %v", err)
	}
	if err := db.Register("testReceiver", "password"); err != nil {
		t.Fatalf("Failed to register testReceiver: %v", err)
	}

	senderID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testUser: %v", err)
	}
	receiverID, err := db.Authenticate("testReceiver", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testReceiver: %v", err)
	}

	// Pre-insert message
	content := "Hello testReceiver!"
	if err := db.InsertMessage(senderID, receiverID, content); err != nil {
		t.Fatalf("Failed to insert message: %v", err)
	}

	handlerInstance := handler.RequestHandler{DB: db}

	req := httptest.NewRequest("GET",
		"/api/dm/history?sender_id="+strconv.Itoa(senderID)+"&receiver_id="+strconv.Itoa(receiverID), nil)
	rec := httptest.NewRecorder()

	handlerInstance.HandleGetDMHistory(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}

	var messages []map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&messages); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if len(messages) == 0 {
		t.Fatal("Expected at least one message in history")
	}

	last := messages[len(messages)-1]
	if last["content"] != content {
		t.Errorf("Expected content %q, got %q", content, last["content"])
	}
}

func TestGetDMHistoryEndpointAdvanced(t *testing.T) {
	db, _ := setupDMTestDB(t)
	defer db.Close()
	defer cleanupDMTestData(db, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register testUser: %v", err)
	}
	if err := db.Register("testReceiver", "password"); err != nil {
		t.Fatalf("Failed to register testReceiver: %v", err)
	}

	senderID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testUser: %v", err)
	}
	receiverID, err := db.Authenticate("testReceiver", "password")
	if err != nil {
		t.Fatalf("Failed to authenticate testReceiver: %v", err)
	}

	handlerInstance := handler.RequestHandler{DB: db}

	// Send messages: user1 -> user2, then user2 -> user1
	messages := []struct {
		fromID  int
		toID    int
		content string
	}{
		{senderID, receiverID, "Hello from testUser!"},
		{receiverID, senderID, "Reply from testReceiver!"},
		{senderID, receiverID, "Second message from testUser!"},
	}

	for _, msg := range messages {
		body, _ := json.Marshal(map[string]interface{}{
			"sender_id":   msg.fromID,
			"receiver_id": msg.toID,
			"content":     msg.content,
		})

		req := httptest.NewRequest("POST", "/api/dm/send", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		handlerInstance.HandleSendDM(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("Failed to send message: %q — Status: %d", msg.content, rec.Code)
		}
	}

	// Fetch history from testUser's side
	req := httptest.NewRequest("GET",
		"/api/dm/history?sender_id="+strconv.Itoa(senderID)+"&receiver_id="+strconv.Itoa(receiverID), nil)
	rec := httptest.NewRecorder()
	handlerInstance.HandleGetDMHistory(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}

	var history []map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&history); err != nil {
		t.Fatalf("Failed to decode history: %v", err)
	}

	if len(history) != len(messages) {
		t.Fatalf("Expected %d messages in history, got %d", len(messages), len(history))
	}

	// Check content and sender/receiver order
	for i, msg := range messages {
		h := history[i]

		gotContent := h["content"].(string)
		gotSender := int(h["sender_id"].(float64))
		gotReceiver := int(h["receiver_id"].(float64))

		if gotContent != msg.content {
			t.Errorf("Message %d content mismatch: expected %q, got %q", i, msg.content, gotContent)
		}
		if gotSender != msg.fromID {
			t.Errorf("Message %d sender mismatch: expected %d, got %d", i, msg.fromID, gotSender)
		}
		if gotReceiver != msg.toID {
			t.Errorf("Message %d receiver mismatch: expected %d, got %d", i, msg.toID, gotReceiver)
		}
	}
}
