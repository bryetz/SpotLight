package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"SpotLight/backend/src/database"
	"SpotLight/backend/src/handler"
	"SpotLight/backend/src/routes"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// Port the server listens on
const portNum = ":8080"

func main() {
	log.Println("Starting the API backend...")

	// Create file management system based on default relative path
	fm := database.NewFileManager()

	// Initialize the database with retries
	var db *database.DBInterface
	var err error
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		db, err = database.NewDBInterface()
		if err == nil {
			break
		}
		log.Printf("Failed to connect to database (attempt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(time.Second * 2)
	}
	if err != nil {
		log.Fatalf("Failed to connect to database after %d attempts: %v", maxRetries, err)
	}
	defer db.Close()

	// Create request handler
	handlerInstance := &handler.RequestHandler{DB: db, FM: fm}

	// Initialize router and register routes
	router := mux.NewRouter()
	routes.RegisterRoutes(router, handlerInstance)

	// Enable CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000"}), // Allow frontend requests
		handlers.AllowedMethods([]string{"GET", "POST", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)(router)

	// Start the HTTP server
	log.Printf("Server started on port %s", portNum)
	fmt.Println("Press CTRL+C to stop the server.")

	if err := http.ListenAndServe(portNum, corsHandler); err != nil {
		log.Fatal(err)
	}
}
