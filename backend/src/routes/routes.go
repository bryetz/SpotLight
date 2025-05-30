package routes

import (
	"SpotLight/backend/src/handler"

	"github.com/gorilla/mux"
)

// RegisterRoutes sets up API endpoints
func RegisterRoutes(router *mux.Router, h *handler.RequestHandler) {
	// User-related routes
	router.HandleFunc("/api/register", h.HandleRegister).Methods("POST")
	router.HandleFunc("/api/login", h.HandleLogin).Methods("POST")
	router.HandleFunc("/api/delete-user", h.HandleDeleteUser).Methods("DELETE")
	router.HandleFunc("/api/profile/{id}", h.HandleGetProfilePosts).Methods("GET")

	// Post-related routes
	router.HandleFunc("/api/posts", h.HandleGetPosts).Methods("GET")
	router.HandleFunc("/api/posts", h.HandleCreatePost).Methods("POST")
	router.HandleFunc("/api/posts/{id}", h.HandleGetSpecificPost).Methods("GET")
	router.HandleFunc("/api/posts/{id}", h.HandleDeletePost).Methods("DELETE")

	// Like-related routes
	router.HandleFunc("/api/posts/{id}/like", h.HandleLikePost).Methods("POST")
	router.HandleFunc("/api/posts/{id}/unlike", h.HandleUnlikePost).Methods("POST")
	router.HandleFunc("/api/posts/{id}/likes", h.HandleGetPostLikes).Methods("GET")
	router.HandleFunc("/api/posts/{id}/liked", h.HandleCheckPostLiked).Methods("GET")

	// Comment-related routes
	router.HandleFunc("/api/posts/{id}/comments", h.HandleCreateComment).Methods("POST")
	router.HandleFunc("/api/posts/{id}/comments", h.HandleGetNestedComments).Methods("GET")
	router.HandleFunc("/api/comments/{id}", h.HandleDeleteComment).Methods("DELETE")

	// Post file related routes
	router.HandleFunc("/api/file", h.HandleGetFile).Methods("GET")

	// DM-related routes
	router.HandleFunc("/api/dm/send", h.HandleSendDM).Methods("POST")
	router.HandleFunc("/api/dm/history", h.HandleGetDMHistory).Methods("GET")
	router.HandleFunc("/ws", h.HandleWebSocket)

	// Search route
	router.HandleFunc("/api/search", h.HandleSearch).Methods("GET")
}
