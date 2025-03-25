package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"SpotLight/backend/src/database"
	"github.com/gorilla/mux"
)

// RequestHandler manages API requests
type RequestHandler struct {
	DB *database.DBInterface
}

// HandleRegister processes user registration
func (h *RequestHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Ensure required fields are present
	if req.Username == "" || req.Password == "" {
		http.Error(w, `{"message": "Username and password are required"}`, http.StatusBadRequest)
		return
	}

	// Register user
	if err := h.DB.Register(req.Username, req.Password); err != nil {
		http.Error(w, `{"message": "User registration failed"}`, http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// HandleLogin processes user login
func (h *RequestHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Ensure required fields are present
	if req.Username == "" || req.Password == "" {
		http.Error(w, `{"message": "Username and password are required"}`, http.StatusBadRequest)
		return
	}

	// Authenticate user and retrieve user ID
	userID, err := h.DB.Authenticate(req.Username, req.Password)
	if err != nil {
		http.Error(w, `{"message": "Invalid username or password"}`, http.StatusUnauthorized)
		return
	}

	// Return successful login response with user ID
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"user_id": userID,
	})
}

// HandleDeleteUser processes user deletion
func (h *RequestHandler) HandleDeleteUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Ensure required field is present
	if req.Username == "" {
		http.Error(w, `{"message": "Username is required"}`, http.StatusBadRequest)
		return
	}

	// Delete user
	if err := h.DB.DeleteUser(req.Username); err != nil {
		http.Error(w, `{"message": "Failed to delete user"}`, http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}

// HandleCreatePost processes creating a post
func (h *RequestHandler) HandleCreatePost(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID    int     `json:"user_id"`
		Content   string  `json:"content"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Ensure required fields are present
	if req.UserID == 0 || req.Content == "" {
		http.Error(w, `{"message": "User ID and content are required"}`, http.StatusBadRequest)
		return
	}

	// Create post
	if err := h.DB.CreatePost(req.UserID, req.Content, req.Latitude, req.Longitude); err != nil {
		http.Error(w, `{"message": "Failed to create post"}`, http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post created successfully"})
}

// HandleGetPosts retrieves all posts
func (h *RequestHandler) HandleGetPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.DB.GetPosts()
	if err != nil {
		http.Error(w, `{"message": "Failed to retrieve posts"}`, http.StatusInternalServerError)
		return
	}

	// Return posts as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// HandleDeletePost removes a post by ID
func (h *RequestHandler) HandleDeletePost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid post ID"}`, http.StatusBadRequest)
		return
	}

	// Delete post
	if err := h.DB.DeletePost(postID); err != nil {
		http.Error(w, `{"message": "Failed to delete post"}`, http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post deleted successfully"})
}

func (h *RequestHandler) HandleLikePost(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID int `json:"user_id"`
		PostID int `json:"post_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.LikePost(req.UserID, req.PostID); err != nil {
		http.Error(w, `{"message": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post liked successfully"})
}

func (h *RequestHandler) HandleGetPostLikes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid post ID"}`, http.StatusBadRequest)
		return
	}

	usernames, err := h.DB.GetPostLikes(postID)
	if err != nil {
		http.Error(w, `{"message": "Failed to retrieve likes"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"post_id":   postID,
		"usernames": usernames,
	})
}

func (h *RequestHandler) HandleUnlikePost(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID int `json:"user_id"`
		PostID int `json:"post_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.UnlikePost(req.UserID, req.PostID); err != nil {
		http.Error(w, `{"message": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post unliked successfully"})
}
