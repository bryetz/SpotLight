package handler

import (
	"bytes"
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

		var data []byte = []byte(req.Media)

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
	//fmt.Println(r.RequestURI)
	parsedURL, err := url.Parse(r.RequestURI)
	if err != nil {
		http.Error(w, `{"message": "Error getting userId"}`, http.StatusInternalServerError)
		return
	}

	// get params from parsed header in get request
	params := parsedURL.Query()

	// Extract specific parameters

	fmt.Println(params.Get("userId"))
	userId, err := strconv.Atoi(params.Get("userId"))
	if err != nil {
		http.Error(w, `{"message": "Error getting userId"}`, http.StatusInternalServerError)
		return
	}

	postId, err := strconv.Atoi(params.Get("postId"))
	if err != nil {
		http.Error(w, `{"message": "Error getting postId"}`, http.StatusInternalServerError)
		return
	}

	fileName := params.Get("fileName")
	if fileName == "" {
		http.Error(w, `{"message": "Error no file name found"}`, http.StatusInternalServerError)
		return
	}

	userName, err := h.DB.GetUserNameId(userId)
	if err != nil {
		http.Error(w, `{"message": "Error getting username from userId"}`, http.StatusInternalServerError)
		return
	}

	// fmt.Printf("finding file of: %s, %d, %s\n", userName, postId, fileName)

	data, err := h.FM.GetPostFile(userName, postId, fileName) //h.FM.GetPostFile(strconv.Itoa(userId), postId, fileName)
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
	fmt.Println("writing back: " + string(data))
	_, err = io.Copy(w, bytes.NewReader(data)) //w.Write(data)
	if err != nil {
		http.Error(w, "Failed to write file.", http.StatusInternalServerError)
		return
	}
}
