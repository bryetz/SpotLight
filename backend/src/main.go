package main

import (
	"fmt"
	"log"
	"net/http"

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

	// Initialize the database connection
	db, err := database.NewDBInterface()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create request handler
	handlerInstance := &handler.RequestHandler{DB: db}

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
