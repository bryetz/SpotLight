package main

import (
	"SpotLight/backend/src/database"
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
)

func main() {
	db, err := database.NewDBInterface()
	if err != nil {
		log.Fatalf("Error initializing database: %v\n", err)
	}
	defer db.Close()

	fmt.Println("Connected to database!")
	fmt.Println("Available commands: 'register', 'login', 'post', 'exit'")

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
				err := db.Register(args[1], args[2])
				if err != nil {
					fmt.Println(err)
				}
			}
		case "login":
			if len(args) < 3 {
				fmt.Println("Usage: login <username> <password>")
			} else {
				err := db.Login(args[1], args[2])
				if err != nil {
					fmt.Println(err)
				}
			}
		case "post":
			if len(args) < 2 {
				fmt.Println("Usage: post <content>")
			} else {
				err := db.Post(strings.Join(args[1:], " "))
				if err != nil {
					fmt.Println(err)
				}
			}
		case "exit":
			fmt.Println("Exiting...")
			return
		default:
			fmt.Println("Unknown command. Try 'register', 'login', 'post', or 'exit'.")
		}
	}
}
