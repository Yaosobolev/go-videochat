package main

import (
	"log"
	"video-chat/api/server"
)

func main() {
	if err := server.Run(); err != nil {
		log.Fatalln(err.Error())
	}

}
