package main

import (
	"fmt"           // formatting and printing values to the console.
	"log"           // logging messages to the console.
	"net/http"      // Used for build HTTP servers and clients.
	"os"            // read/write files on system
	"path/filepath" // deal with file paths/extentions
	"regexp"        // regexp handling
)

// arbitrary page struct, defunct for now
type Page struct {
	title string
	data  []byte
}

// TODO: wrap all functions below around this struct
type RequestHandler struct{}

// also have other structs that would be ConnectionManager
// which would manage much of the server processes
type ConnectionManager struct{}

// Port we listen on.
const portNum string = ":8080"

// Handler functions.
func Home(w http.ResponseWriter, r *http.Request) {
	// arbitrary location where file pages live
	var FILE_LOC_ROOT string = "../pages/"

	//fmt.Println(r.URL.Path) // use this to parse URI page request
	// fmt.Println(r.RequestURI) // use this to parse URI page request
	var requestHeader string = r.URL.Path
	var validPathRegex = regexp.MustCompile("/([ -~]*)") // very mimial regex
	var matches = validPathRegex.FindStringSubmatch(requestHeader)

	if len(matches) == 0 {
		return
	}

	var updatedReq = matches[0]

	pathType := updatedReq[1:]
	var contentType string
	switch filepath.Ext(pathType) { // sequence to correct file we want to send
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

	if updatedReq == "/" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		retData, _ = os.ReadFile((FILE_LOC_ROOT + "index.html"))
	} else {
		retData, _ = os.ReadFile((FILE_LOC_ROOT + updatedReq))
	}

	if retData == nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}

	// Write the file content to the response
	w.Write(retData)
}

func main() {
	log.Println("Starting our simple http server.")

	// Registering our handler functions, and creating paths.
	http.HandleFunc("/", Home)

	log.Println("Started on port", portNum)
	fmt.Println("To close connection CTRL+C :-)")

	// Spinning up the server.
	err := http.ListenAndServe(portNum, nil)
	if err != nil {
		log.Fatal(err)
	}

}
