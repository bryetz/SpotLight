package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

var db *pgx.Conn
var currentUserID int // Tracks logged-in user ID

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found. Using system environment variables.")
	}

	// Get DATABASE_URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	// Connect to Postgres
	db, err = pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close(context.Background())

	fmt.Println("Connected to database!")
	fmt.Println("Available commands: 'register', 'login', 'exit'")

	scanner := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("> ")
		scanner.Scan()
		input := scanner.Text()
		args := strings.Split(input, " ")

		switch args[0] {
		case "register":
			if len(args) < 3 {
				fmt.Println("Usage: register <username> <password>")
			} else {
				register(args[1], args[2])
			}
		case "login":
			if len(args) < 3 {
				fmt.Println("Usage: login <username> <password>")
			} else {
				login(args[1], args[2])
			}
		case "post":
			if len(args) < 2 {
				fmt.Println("Usage: post <content>")
			} else {
				post(strings.Join(args[1:], " "))
			}
		case "exit":
			fmt.Println("Exiting...")
			return
		default:
			fmt.Println("Unknown command. Try 'register', 'login', or 'exit'.")
		}
	}
}

func register(username, password string) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Error hashing password: %v\n", err)
		return
	}

	// Insert the user into the database
	_, err = db.Exec(context.Background(), "INSERT INTO users (username, password_hash) VALUES ($1, $2)", username, string(hashedPassword))
	if err != nil {
		fmt.Printf("Error registering user: %v\n", err)
		return
	}

	fmt.Println("User registered successfully!")
}

func login(username, password string) {
	// Retrieve hashed password from db
	var userID int
	var storedHash string
	err := db.QueryRow(context.Background(), "SELECT id, password_hash FROM users WHERE username=$1", username).Scan(&userID, &storedHash)
	if err != nil {
		fmt.Println("Invalid username or password.")
		return
	}

	// Verify the password
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		fmt.Println("Invalid username or password.")
		return
	}

	// Set user ID and display posts
	currentUserID = userID
	fmt.Println("Login successful!")
	viewPosts()
}

func getLocation() (float64, float64, error) {
	resp, err := http.Get("http://ip-api.com/json/")
	if err != nil {
		return 0.0, 0.0, err
	}
	defer resp.Body.Close()

	var result struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0.0, 0.0, err
	}

	return result.Lat, result.Lon, nil
}

func post(content string) {
	if currentUserID == 0 {
		fmt.Println("You must log in to create a post!")
		return
	}

	// Fetch latitude and longitude
	latitude, longitude, err := getLocation()
	if err != nil {
		fmt.Println("Error determining location, using (0, 0) as fallback.")
		latitude, longitude = 0.0, 0.0
	}

	// Insert post into db
	_, err = db.Exec(context.Background(),
		"INSERT INTO posts (user_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)",
		currentUserID, content, latitude, longitude)
	if err != nil {
		fmt.Printf("Error creating post: %v\n", err)
		return
	}

	fmt.Printf("Posted from location (%f, %f)!\n", latitude, longitude)
}

func viewPosts() {
	rows, err := db.Query(context.Background(), "SELECT p.id, u.username, p.content, p.created_at FROM posts p JOIN users u ON p.user_id = u.id")
	if err != nil {
		fmt.Printf("Error retrieving posts: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("Posts:")
	for rows.Next() {
		var id int
		var username, content string
		var createdAt time.Time
		err = rows.Scan(&id, &username, &content, &createdAt)
		if err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}

		fmt.Printf("ID: %d | User: %s | Content: %s | Created At: %s\n", id, username, content, createdAt.Format("2006-01-02 15:04:05"))
	}
}
