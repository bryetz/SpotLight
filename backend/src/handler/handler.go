package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
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

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, `{"message": "Username and password are required"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.Register(req.Username, req.Password); err != nil {
		http.Error(w, `{"message": "User registration failed"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// HandleLogin processes user login
func (h *RequestHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, `{"message": "Username and password are required"}`, http.StatusBadRequest)
		return
	}

	userID, err := h.DB.Authenticate(req.Username, req.Password)
	if err != nil {
		http.Error(w, `{"message": "Invalid username or password"}`, http.StatusUnauthorized)
		return
	}

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

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Username == "" {
		http.Error(w, `{"message": "Username is required"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteUser(req.Username); err != nil {
		http.Error(w, `{"message": "Failed to delete user"}`, http.StatusInternalServerError)
		return
	}

	// if we delete user, we also delete associated folder
	if err := h.FM.DeleteUserFolder(req.Username); err != nil {
		http.Error(w, `{"message": "Failed to delete user's folder"}`, http.StatusInternalServerError)
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

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

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
		lastPostVal, err1 := h.DB.GetLastPostByUser(req.UserID)
		if err1 != nil {
			http.Error(w, `{"message": "Failed to get last post"}`, http.StatusInternalServerError)
			return
		}
		userName, err1 := h.DB.GetUserNameId(req.UserID)
		if err1 != nil {
			http.Error(w, `{"message": "Failed to get userId"}`, http.StatusInternalServerError)
			return
		}

		// if file is text do simple convert, if binary conv base 64
		ext := filepath.Ext(req.FileName)
		var data []byte //var data []byte = []byte(req.Media)
		var err error
		if ext == ".txt" {
			data = []byte(req.Media)
		} else {
			data, err = base64.StdEncoding.DecodeString(req.Media)
			if err != nil {
				fmt.Printf("Error decoding base64: %v\n", err)
				return
			}
		}

		//h.FM.CreatePostFile(strconv.Itoa(req.UserID), lastPostVal, req.FileName, data)
		h.FM.CreatePostFile(userName, lastPostVal, req.FileName, data)

	} else {
		// Create post basic
		if err := h.DB.CreatePost(req.UserID, req.Content, req.Latitude, req.Longitude); err != nil {
			http.Error(w, `{"message": "Failed to create post"}`, http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post created successfully"})
}

// HandleGetPosts retrieves all posts with optional geo-filtering
func (h *RequestHandler) HandleGetPosts(w http.ResponseWriter, r *http.Request) {
	parsedURL, err := url.Parse(r.RequestURI)
	if err != nil {
		http.Error(w, `{"message": "Failed to parse query parameters"}`, http.StatusBadRequest)
		return
	}

	params := parsedURL.Query()

	latitude, err := strconv.ParseFloat(params.Get("latitude"), 64)
	if err != nil {
		latitude = math.Inf(1)
	}

	longitude, err := strconv.ParseFloat(params.Get("longitude"), 64)
	if err != nil {
		longitude = math.Inf(1)
	}

	distance, err := strconv.Atoi(params.Get("distance"))
	if err != nil {
		distance = -1
	}

	// posts will have metadata as json including file_name which is what
	posts, err := h.DB.GetPosts(latitude, longitude, distance)
	if err != nil {
		http.Error(w, `{"message": "Failed to retrieve posts"}`, http.StatusInternalServerError)
		return
	}

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

	if err := h.DB.DeletePost(postID); err != nil {
		http.Error(w, `{"message": "Failed to delete post"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post deleted successfully"})
}

// HandleLikePost handles liking a post
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

// HandleUnlikePost handles unliking a post
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

// HandleGetPostLikes returns all usernames who liked a post
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"post_id":   postID,
		"usernames": usernames,
	})
}

// HandleGetPostLikes returns boolean if user liked a post
func (h *RequestHandler) HandleCheckPostLiked(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid post ID"}`, http.StatusBadRequest)
		return
	}

	parsedURL, err := url.Parse(r.RequestURI)
	// check get request param for userID
	params := parsedURL.Query()

	userId, err := strconv.Atoi(params.Get("userId"))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"result": false,
		})
		return
	}

	boolCond, err := h.DB.CheckUserLikedPost(postID, userId)
	if err != nil {
		http.Error(w, `{"message": "Failed to retrieve likes"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"result": boolCond,
	})
}

// HandleGetNestedComments returns comments on a post and all their replies
func (h *RequestHandler) HandleGetNestedComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid post ID"}`, http.StatusBadRequest)
		return
	}

	comments, err := h.DB.GetNestedComments(postID)
	if err != nil {
		http.Error(w, `{"message": "Failed to retrieve comments"}`, http.StatusInternalServerError)
		return
	}

	// Return [] even if no comments exist
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// HandleCreateComment creates a comment on a post with support for replies
func (h *RequestHandler) HandleCreateComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid post ID"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		UserID   int    `json:"user_id"`
		Content  string `json:"content"`
		ParentID *int   `json:"parent_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.CreateNestedComment(postID, req.UserID, req.ParentID, req.Content); err != nil {
		http.Error(w, `{"message": "Failed to post comment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment posted"})
}

// HandleDeleteComment deletes a comment and its nested replies
func (h *RequestHandler) HandleDeleteComment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	commentID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"message": "Invalid comment ID"}`, http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteComment(commentID); err != nil {
		http.Error(w, `{"message": "Failed to delete comment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment deleted"})

}

// Get the requested media file from the file manager
func (h *RequestHandler) HandleGetFile(w http.ResponseWriter, r *http.Request) {
	// parse url
	parsedURL, err := url.Parse(r.RequestURI)
	if err != nil {
		fmt.Printf("Error parsing URL: %v\n", err)
		http.Error(w, fmt.Sprintf(`{"message": "Error parsing URL: %v"}`, err), http.StatusBadRequest)
		return
	}

	// get params from parsed header in get request
	params := parsedURL.Query()

	// Extract specific parameters and log them
	userIdStr := params.Get("userId")
	fmt.Printf("Received request - userId: %s\n", userIdStr)

	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		fmt.Printf("Error converting userId: %v\n", err)
		http.Error(w, fmt.Sprintf(`{"message": "Invalid userId format: %v"}`, err), http.StatusBadRequest)
		return
	}

	postIdStr := params.Get("postId")
	fmt.Printf("postId: %s\n", postIdStr)
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		fmt.Printf("Error converting postId: %v\n", err)
		http.Error(w, fmt.Sprintf(`{"message": "Invalid postId format: %v"}`, err), http.StatusBadRequest)
		return
	}

	fileName := params.Get("fileName")
	fmt.Printf("fileName: %s\n", fileName)
	if fileName == "" {
		fmt.Println("No filename provided")
		http.Error(w, `{"message": "No filename provided"}`, http.StatusBadRequest)
		return
	}

	userName, err := h.DB.GetUserNameId(userId)
	if err != nil {
		fmt.Printf("Error getting username for userId %d: %v\n", userId, err)
		http.Error(w, fmt.Sprintf(`{"message": "Error getting username for userId %d: %v"}`, userId, err), http.StatusInternalServerError)
		return
	}
	fmt.Printf("Retrieved username: %s\n", userName)

	// Attempt to get the file
	fmt.Printf("Attempting to get file: user=%s, postId=%d, fileName=%s\n", userName, postId, fileName)
	data, err := h.FM.GetPostFile(userName, postId, fileName)
	if err != nil {
		fmt.Printf("Error getting file: %v\n", err)
		http.Error(w, fmt.Sprintf(`{"message": "Failed to get file: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// get content type from file extension
	ext := filepath.Ext(fileName)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	fmt.Printf("Content-Type: %s\n", contentType)

	// set headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", `attachment; filename="`+fileName+`"`)

	// write data back to user
	fmt.Printf("File size: %d bytes\n", len(data))
	_, err = io.Copy(w, bytes.NewReader(data))
	if err != nil {
		fmt.Printf("Error writing response: %v\n", err)
		// Note: At this point headers are already sent, so we can't send an error response
		// But we can log it
		return
	}

	fmt.Printf("Successfully served file: %s\n", fileName)
}
