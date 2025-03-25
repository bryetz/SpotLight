package routes

import (
	"SpotLight/backend/src/handler"
	"github.com/gorilla/mux"
)

// RegisterRoutes sets up API endpoints
func RegisterRoutes(router *mux.Router, h *handler.RequestHandler) {
	router.HandleFunc("/api/register", h.HandleRegister).Methods("POST")
	router.HandleFunc("/api/login", h.HandleLogin).Methods("POST")
	router.HandleFunc("/api/delete-user", h.HandleDeleteUser).Methods("DELETE")
	router.HandleFunc("/api/posts", h.HandleGetPosts).Methods("GET")
	router.HandleFunc("/api/posts", h.HandleCreatePost).Methods("POST")
	router.HandleFunc("/api/posts/{id}", h.HandleDeletePost).Methods("DELETE")
	router.HandleFunc("/api/posts/like", h.HandleLikePost).Methods("POST")
	router.HandleFunc("/api/posts/{id}/likes", h.HandleGetPostLikes).Methods("GET")
	router.HandleFunc("/api/posts/unlike", h.HandleUnlikePost).Methods("POST")
}
