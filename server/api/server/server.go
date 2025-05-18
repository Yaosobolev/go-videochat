package server

import (
	"flag"
	"os"
	"time"
	"video-chat/api/handlers"
	"video-chat/api/routes"

	w "video-chat/pkg/webrtc"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

var (
	addr = flag.String("addr", ":", os.Getenv("PORT"))
	cert = flag.String("cert", "", "")
	key  = flag.String("key", "", "")
)

func Run() error {
	flag.Parse()

	if *addr == ":" {
		*addr = ":8080"
	}

	app := fiber.New(fiber.Config{
		ServerHeader: "MyApp",
	})

	app.Use(logger.New())
	app.Use(cors.New())

	app.Get("/", handlers.Welcome)
	routes.RoomRouter(app)
	routes.StreamRouter(app)

	w.Rooms = make(map[string]*w.Room)
	w.Streams = make(map[string]*w.Room)
	go dispatchKeyFrames()
	if *cert != "" {
		return app.ListenTLS(*addr, *cert, *key)
	}
	return app.Listen(*addr)
}

func dispatchKeyFrames() {
	for range time.NewTicker(time.Second * 3).C {
		for _, room := range w.Rooms {
			room.Peers.DispatchKeyFrame()
		}

	}
}
