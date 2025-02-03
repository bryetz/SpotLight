package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"

	"SpotLight/backend/src/database"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// RequestHandler manages API requests
type RequestHandler struct {
	DB *database.DBInterface
}

// Port we listen on
const portNum = ":8080"

// Serve static files (HTML, CSS, JS)
func serveStaticFiles(w http.ResponseWriter, r *http.Request) {
	// Define the root directory for files
	var FileLocRoot = "../pages/"
	requestHeader := r.URL.Path
	validPathRegex := regexp.MustCompile("/([ -~]*)")
	matches := validPathRegex.FindStringSubmatch(requestHeader)

	if len(matches) == 0 {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}

	updatedReq := matches[0]
	pathType := updatedReq[1:]

	// Determine Content-Type
	var contentType string
	switch filepath.Ext(pathType) {
	case ".html":
		contentType = "text/html; charset=utf-8"
	case ".css":
		contentType = "text/css"
	case ".js":
		contentType = "application/javascript"
	default:
		contentType = "text/plain"
	}
	w.Header().Set("Content-Type", contentType)

	var retData []byte
	var err error

	// Serve index.html if requesting `/`
	if updatedReq == "/" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		retData, err = os.ReadFile(filepath.Join(FileLocRoot, "index.html"))
	} else {
		retData, err = os.ReadFile(filepath.Join(FileLocRoot, updatedReq))
	}

	if err != nil {
		http.Error(w, "File Not Found", http.StatusNotFound)
		return
	}

	w.Write(retData)
}

// Register API routes
func (h *RequestHandler) registerRoutes(r *mux.Router) {
	r.HandleFunc("/api/register", h.DB.HandleRegister).Methods("POST")
	r.HandleFunc("/api/login", h.DB.HandleLogin).Methods("POST")
	r.HandleFunc("/api/posts", h.DB.HandlePosts).Methods("GET", "POST")
	r.PathPrefix("/").HandlerFunc(serveStaticFiles) // Serve static files
}

// Main function
func main() {
	log.Println("Starting the API backend...")

	// Initialize the database
	db, err := database.NewDBInterface()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create a new request handler with DB
	handler := &RequestHandler{DB: db}

	// Initialize router
	r := mux.NewRouter()
	handler.registerRoutes(r)

	// Enable CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000"}), // Allow frontend
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)(r)

	// Start HTTP server
	log.Printf("Server started on port %s", portNum)
	fmt.Println("Press CTRL+C to stop the server.")

	err = http.ListenAndServe(portNum, corsHandler)
	if err != nil {
		log.Fatal(err)
	}
}
