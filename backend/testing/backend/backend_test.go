package backend_test

import (
	"SpotLight/backend/src/database"
	"SpotLight/backend/src/handler"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/gorilla/mux"
)

// setupTestDB initializes the test database connection
func setupTestDB(t *testing.T) (*database.DBInterface, *bool) {
	db, err := database.NewDBInterface()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	userCreated := false
	return db, &userCreated
}

// cleanupTestData removes test users at the end of each test
func cleanupTestData(db *database.DBInterface, userCreated *bool, t *testing.T) {
	if *userCreated {
		err := db.DeleteUser("testUser")
		if err != nil {
			t.Logf("Warning: Failed to delete test user: %v", err)
		}
	}
}

// alternative cleanup removes test users at the end of each test
func cleanupTestDataAll(db *database.DBInterface, fm *database.FileManager, userCreated *bool, t *testing.T) {
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

// TestRegisterEndpoint verifies user registration via API
func TestRegisterEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	fm := database.NewFileManager() // example of creating fm and assigning it
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	reqBody := `{"username":"testUser","password":"password"}`
	req := httptest.NewRequest("POST", "/api/register", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db, FM: fm}
	handlerInstance.HandleRegister(rec, req)

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

	reqBody := `{"username":"testUser","password":"password"}`
	req := httptest.NewRequest("POST", "/api/login", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db}
	handlerInstance.HandleLogin(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	// Decode response body
	var responseData map[string]interface{}
	err := json.NewDecoder(rec.Body).Decode(&responseData)
	if err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}

	// Validate response contains user_id
	if _, ok := responseData["user_id"]; !ok {
		t.Fatalf("Login response missing 'user_id'")
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

	// Authenticate and retrieve user ID
	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	// Prepare post request
	postBody, err := json.Marshal(map[string]interface{}{
		"user_id":   userID,
		"content":   "Hello, API!",
		"file_name": "",
		"media":     "",
		"latitude":  37.7749,
		"longitude": -122.4194,
	})
	if err != nil {
		t.Fatalf("Failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(postBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db}
	handlerInstance.HandleCreatePost(rec, req)

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

	handlerInstance := handler.RequestHandler{DB: db}
	handlerInstance.HandleGetPosts(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	// Validate JSON response
	var posts []map[string]interface{}
	err := json.NewDecoder(rec.Body).Decode(&posts)
	if err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}
}

// TestDeleteUserEndpoint verifies user deletion via API
func TestDeleteUserEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	fm := database.NewFileManagerPath("../../../data") // example of creating fm with different folder path
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	// Send DELETE request to API
	reqBody, _ := json.Marshal(map[string]string{"username": "testUser"})
	req := httptest.NewRequest("DELETE", "/api/delete-user", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db, FM: fm}
	handlerInstance.HandleDeleteUser(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	*userCreated = false

	// Verify user deletion by trying to log in again
	if _, err := db.Authenticate("testUser", "password"); err == nil {
		t.Fatalf("User should have been deleted but can still log in")
	}
}

func TestDeletePostEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	defer db.Close()
	defer cleanupTestData(db, userCreated, t)

	// Register test user
	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	// Authenticate and get user ID
	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	// Create a post
	postBody, err := json.Marshal(map[string]interface{}{
		"user_id":   userID,
		"content":   "Test post for deletion",
		"file_name": "",
		"media":     "",
		"latitude":  0,
		"longitude": 0,
	})
	if err != nil {
		t.Fatalf("Failed to marshal JSON: %v", err)
	}

	postReq := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(postBody))
	postReq.Header.Set("Content-Type", "application/json")
	postRec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db}
	handlerInstance.HandleCreatePost(postRec, postReq)

	if postRec.Code != http.StatusCreated {
		t.Fatalf("Expected post creation status 201, got %d", postRec.Code)
	}

	// Retrieve posts to get the ID of the newly created post
	getReq := httptest.NewRequest("GET", "/api/posts", nil)
	getRec := httptest.NewRecorder()
	handlerInstance.HandleGetPosts(getRec, getReq)

	var posts []map[string]interface{}
	err = json.NewDecoder(getRec.Body).Decode(&posts)
	if err != nil {
		t.Fatalf("Failed to decode posts JSON: %v", err)
	}

	if len(posts) == 0 {
		t.Fatalf("Expected at least one post but got none")
	}

	// Get the post_id of the most recent post
	postID := int(posts[0]["post_id"].(float64)) // Convert from float64
	t.Logf("Post created with ID: %d", postID)

	deleteReq := httptest.NewRequest("DELETE", "/api/posts/"+strconv.Itoa(postID), nil)
	deleteReq = mux.SetURLVars(deleteReq, map[string]string{"id": strconv.Itoa(postID)})
	deleteRec := httptest.NewRecorder()

	handlerInstance.HandleDeletePost(deleteRec, deleteReq)

	if deleteRec.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for deletion, got %d", deleteRec.Code)
	}

	// Verify the post is deleted by fetching posts again
	getReqAfterDelete := httptest.NewRequest("GET", "/api/posts", nil)
	getRecAfterDelete := httptest.NewRecorder()
	handlerInstance.HandleGetPosts(getRecAfterDelete, getReqAfterDelete)

	var postsAfterDelete []map[string]interface{}
	err = json.NewDecoder(getRecAfterDelete.Body).Decode(&postsAfterDelete)
	if err != nil {
		t.Fatalf("Failed to decode posts JSON after deletion: %v", err)
	}

	// Ensure the deleted post is no longer present
	for _, post := range postsAfterDelete {
		if int(post["post_id"].(float64)) == postID {
			t.Fatalf("Post was not deleted correctly, still exists in the database")
		}
	}
	t.Log("Post successfully deleted")
}

// TestCreatePostFileEndpoint verifies post creation with data via API
func TestCreatePostFileEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	fm := database.NewFileManagerPath("../../../data") // example of creating fm with different folder path
	defer db.Close()
	// sometimes you want to keep files to see them appear in dir list,
	// use cleanupTestData if u want to see files, otherwise use all
	//defer cleanupTestData(db, userCreated, t)
	defer cleanupTestDataAll(db, fm, userCreated, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	// Authenticate and retrieve user ID
	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	// Prepare post request
	postBody, err := json.Marshal(map[string]interface{}{
		"user_id":   userID,
		"content":   "Hello, API!",
		"file_name": "hello.txt",
		"media":     "something to do extra.",
		"latitude":  37.7749,
		"longitude": -122.4194,
	})
	if err != nil {
		t.Fatalf("Failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(postBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db, FM: fm}
	handlerInstance.HandleCreatePost(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}
}

// TestCreatePostFileEndpoint verifies post creation with data via API
func TestGetPostFileEndpoint(t *testing.T) {
	db, userCreated := setupTestDB(t)
	fm := database.NewFileManagerPath("../../../data") // example of creating fm with different folder path
	defer db.Close()
	//defer cleanupTestData(db, userCreated, t)
	// sometimes you want to keep files to see them appear in dir list
	defer cleanupTestDataAll(db, fm, userCreated, t)

	if err := db.Register("testUser", "password"); err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	*userCreated = true

	// Authenticate and retrieve user ID
	userID, err := db.Authenticate("testUser", "password")
	if err != nil {
		t.Fatalf("Failed to log in: %v", err)
	}

	// Prepare post request
	postBody, err := json.Marshal(map[string]interface{}{
		"user_id":   userID,
		"content":   "Hello, API!",
		"file_name": "hello.txt",
		"media":     "Hello operator, call me back when you get this.",
		"latitude":  37.7749,
		"longitude": -122.4194,
	})
	if err != nil {
		t.Fatalf("Failed to marshal JSON: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(postBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlerInstance := handler.RequestHandler{DB: db, FM: fm}
	handlerInstance.HandleCreatePost(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}

	// now get list of posts generally

	// Retrieve posts to get the ID of the newly created post
	getReq := httptest.NewRequest("GET", "/api/posts", nil)
	getRec := httptest.NewRecorder()
	handlerInstance.HandleGetPosts(getRec, getReq)
	/*
		// this is the expected format for posts
		posts = append(posts, map[string]interface{}{
				"post_id":    postID,
				"username":   username,
				"content":    content,
				"latitude":   latitude,
				"longitude":  longitude,
				"created_at": createdAt.Format(time.RFC3339),
				"file_name":  filename,
			})
	*/

	var posts []map[string]interface{}
	err = json.NewDecoder(getRec.Body).Decode(&posts)
	if err != nil {
		t.Fatalf("Failed to decode posts JSON: %v", err)
	}

	if len(posts) == 0 {
		t.Fatalf("Expected at least one post but got none")
	}

	// loop to find the specific post we are testing and checking file content
	var specifcPost map[string]interface{}
	for i, _ := range posts {
		// find the post of a certain user since we know they only made one post
		if posts[i]["username"] == "testUser" {
			specifcPost = posts[i]
			break
		}
	}

	// get parts of our metadata to request for file of desired post
	postID := int(specifcPost["post_id"].(float64)) // Convert from float64
	fileName := string(specifcPost["file_name"].(string))
	t.Logf("Post created with ID: %d", postID)

	// now doing 2nd step of getting the files from the names obtained in the last request

	// now make a get request and check if the file content is the same as sent
	fileReq := httptest.NewRequest("GET", "/api/file?userId="+strconv.Itoa(userID)+"&postId="+strconv.Itoa(postID)+"&fileName="+fileName, nil)
	fileRec := httptest.NewRecorder()

	handlerInstance.HandleGetFile(fileRec, fileReq)

	// check Content-Type
	contentType := fileRec.Header().Get("Content-Type")
	if contentType != "text/plain; charset=utf-8" {
		t.Errorf("Expected Content-Type 'text/plain', got '%s'", contentType)
	}

	// compare filename from Content-Disposition
	contentDisposition := fileRec.Header().Get("Content-Disposition")
	if !strings.Contains(contentDisposition, `filename="hello.txt"`) {
		t.Errorf("Expected filename 'hello.txt', got '%s'", contentDisposition)
	}

	// read body
	body, err := io.ReadAll(fileRec.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	expectedContent := "Hello operator, call me back when you get this."
	if string(body) != expectedContent {
		t.Errorf("Expected body content '%s', got '%s'", expectedContent, string(body))
	}

	if fileRec.Code != http.StatusOK {
		t.Errorf("Expected status code 200, got %d", fileRec.Code)
	}
}
