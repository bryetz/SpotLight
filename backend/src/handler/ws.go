package handler

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// Allow all connections for development
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Allow requests from standard frontend dev port
		if origin == "http://localhost:3000" {
			log.Printf("Allowing WebSocket connection from origin: %s", origin)
			return true
		}
		log.Printf("Blocking WebSocket connection from origin: %s", origin)
		return false // Block other origins
	},
}

type WebSocketHub struct {
	clients    map[int]*websocket.Conn // userID to connection
	register   chan *WSClient
	unregister chan int
	broadcast  chan WSMessage
}

type WSClient struct {
	userID int
	conn   *websocket.Conn
}

type WSMessage struct {
	From    int    `json:"from"`
	To      int    `json:"to"`
	Content string `json:"content"`
}

var Hub = WebSocketHub{
	clients:    make(map[int]*websocket.Conn),
	register:   make(chan *WSClient),
	unregister: make(chan int),
	broadcast:  make(chan WSMessage),
}

// StartHub runs the WebSocket message router
func StartHub() {
	log.Println("WebSocket Hub started")
	for {
		select {
		case client := <-Hub.register:
			log.Printf("Registering client: User %d", client.userID)
			Hub.clients[client.userID] = client.conn
		case userID := <-Hub.unregister:
			log.Printf("Unregistering client: User %d", userID)
			// Check if client exists before deleting and closing
			if conn, ok := Hub.clients[userID]; ok {
				delete(Hub.clients, userID)
				conn.Close() // Ensure connection is closed if hub removes it
				log.Printf("Closed connection for unregistered user %d", userID)
			}
		case msg := <-Hub.broadcast:
			log.Printf("Hub received broadcast message: From %d To %d", msg.From, msg.To)
			
			// Send to recipient if connected
			if recipientConn, ok := Hub.clients[msg.To]; ok {
				log.Printf("Found recipient connection for user %d. Sending message.", msg.To)
				if err := recipientConn.WriteJSON(msg); err != nil {
					log.Printf("Error writing JSON to recipient %d: %v. Removing client.", msg.To, err)
					delete(Hub.clients, msg.To)
					recipientConn.Close()
				}
			} else {
				log.Printf("Recipient user %d not found or not connected.", msg.To)
			}

			// Send back to sender if connected (and not sending to self)
			if msg.From != msg.To {
				if senderConn, ok := Hub.clients[msg.From]; ok {
					log.Printf("Found sender connection for user %d. Sending echo message.", msg.From)
					if err := senderConn.WriteJSON(msg); err != nil {
						log.Printf("Error writing JSON echo to sender %d: %v. Removing client.", msg.From, err)
						delete(Hub.clients, msg.From)
						senderConn.Close()
					}
				} else {
					// This case should be rare if the sender just sent a message, 
					// but log it just in case.
					log.Printf("Sender user %d not found or not connected for echo.", msg.From)
				}
			}

		}
	}
}
