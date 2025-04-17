package handler

import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{}

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
	for {
		select {
		case client := <-Hub.register:
			Hub.clients[client.userID] = client.conn
		case userID := <-Hub.unregister:
			delete(Hub.clients, userID)
		case msg := <-Hub.broadcast:
			if conn, ok := Hub.clients[msg.To]; ok {
				conn.WriteJSON(msg)
			}
		}
	}
}
