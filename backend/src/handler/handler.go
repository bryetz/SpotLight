package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"mime"
	"net/http"
	"net/url"
	"path/filepath"
	"strconv"

	"SpotLight/backend/src/database"

	"github.com/gorilla/mux"
)

// RequestHandler manages API requests
type RequestHandler struct {
	DB *database.DBInterface
	FM *database.FileManager
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
		FileName  string  `json:"file_name"`
		Media     string  `json:"media"`
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

	if req.FileName != "" && req.Media != "" { // have fileName
		if err := h.DB.CreatePostFile(req.UserID, req.Content, req.Latitude, req.Longitude, req.FileName); err != nil {
			http.Error(w, `{"message": "Failed to create post"}`, http.StatusInternalServerError)
			return
		}
		// after putting post in database, search for it and get it's id so we put the file in the fileList
		lastPostVal, err := h.DB.GetLastPostByUser(req.UserID)
		if err == nil {
			// decode string data
			data, err := base64.StdEncoding.DecodeString(req.Media)
			if err != nil {
				fmt.Println("Error decoding Base64:", err)
				return
			}
			h.FM.CreatePostFile(strconv.Itoa(req.UserID), lastPostVal, req.FileName, data)
		}
	} else {
		// Create post basic
		if err := h.DB.CreatePost(req.UserID, req.Content, req.Latitude, req.Longitude); err != nil {
			http.Error(w, `{"message": "Failed to create post"}`, http.StatusInternalServerError)
			return
		}
	}

	// Return success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post created successfully"})
}

// HandleGetPosts retrieves all posts
func (h *RequestHandler) HandleGetPosts(w http.ResponseWriter, r *http.Request) {
	// parse url
	//fmt.Println(r.RequestURI)
	parsedURL, err := url.Parse(r.RequestURI)
	if err != nil {
		fmt.Println("Error parsing URL:", err)
		return
	}

	// get params from parsed header in get request
	params := parsedURL.Query()

	// Extract specific parameters
	latitude, err := strconv.ParseFloat(params.Get("latitude"), 64)
	if err != nil {
		latitude = math.Inf(1)
		fmt.Println("Error converting latitude to float:", err)
	}

	longitude, err := strconv.ParseFloat(params.Get("longitude"), 64)
	if err != nil {
		longitude = math.Inf(1)
		fmt.Println("Error converting longitude to float:", err)
	}

	distance, err := strconv.Atoi(params.Get("distance"))
	if err != nil {
		distance = -1
		fmt.Println("Error converting distance to int:", err)
	}
	// if long/lat is out of range of -90 to 90 and -180 to 180 respectively, show all posts regardless
	// negative distance defaults to regular distance 15km

	// posts will have metadata as json including file_name which is what
	posts, err := h.DB.GetPosts(latitude, longitude, distance)
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

// Get the requested media file from the file manager
func (h *RequestHandler) HandleGetFile(w http.ResponseWriter, r *http.Request) {
	// parse url
	//fmt.Println(r.RequestURI)
	parsedURL, err := url.Parse(r.RequestURI)
	if err != nil {
		fmt.Println("Error parsing URL:", err)
		return
	}

	// get params from parsed header in get request
	params := parsedURL.Query()

	// Extract specific parameters
	userId, err := strconv.Atoi(params.Get("userId"))
	if err != nil {
		fmt.Println("Error converting userId to int:", err)
	}

	postId, err := strconv.Atoi(params.Get("postId"))
	if err != nil {
		fmt.Println("Error converting postId to int:", err)
	}

	fileName := params.Get("fileName")

	data, err := h.FM.GetPostFile(strconv.Itoa(userId), postId, fileName)
	if err != nil {
		http.Error(w, `{"message": "Failed to get post data"}`, http.StatusInternalServerError)
		return
	}

	// get content type from file extention
	ext := filepath.Ext(fileName)
	// use mime to not write 100 if else cases
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream" // Fallback for unknown types
	}
	// set headers and write
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", `attachment; filename="`+fileName+`"`)

	// write data back to user
	_, err = w.Write(data)
	if err != nil {
		http.Error(w, "Failed to write file.", http.StatusInternalServerError)
		return
	}
}
