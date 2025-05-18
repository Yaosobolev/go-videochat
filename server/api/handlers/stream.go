package handlers

import (
	"fmt"
	"os"
	"time"
	w "video-chat/pkg/webrtc"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func Stream(c *fiber.Ctx) error {
	suuid := c.Params("suuid")
	if suuid == "" {
		c.Status(400)
		return nil
	}
	ws := "ws"
	if os.Getenv("ENVIRONMENT") == "PRODUCTION" {
		ws = "wss"
	}
	if _, ok := w.Streams[suuid]; ok {
		w.RoomsLock.Lock()
		return c.JSON(fiber.Map{
			"StreamWebSocketAddr": fmt.Sprintf("%s://%s/stream/%s/websocket", ws, c.Hostname(), suuid),
			"ChatWebSocketAddr":   fmt.Sprintf("%s://%s/stream/%s/chat/websocket", ws, c.Hostname(), suuid),
			"ViewerWebSocketAddr": fmt.Sprintf("%s://%s/stream/%s/viewer/websocket", ws, c.Hostname(), suuid),
			"Type":                "stream",
		})
	}
	w.RoomsLock.Unlock()
	return c.JSON(fiber.Map{
		"NoStream": true,
		"Leave":    true,
	})

}

func StreamWebSocket(c *websocket.Conn) {
	suuid := c.Params("suuid")
	if suuid == "" {
		return
	}
	w.RoomsLock.Lock()
	if stream, ok := w.Streams[suuid]; ok {
		w.RoomsLock.Unlock()
		w.StreamConn(c, stream.Peers)
		return
	}
	w.RoomsLock.Unlock()
}

func StreamViewerWebSocket(c *websocket.Conn) {
	suuid := c.Params("suuid")
	if suuid == "" {
		return
	}
	w.RoomsLock.Lock()
	if stream, ok := w.Streams[suuid]; ok {
		w.RoomsLock.Unlock()
		viewerConn(c, stream.Peers)
		return
	}
	w.RoomsLock.Unlock()
}

func viewerConn(c *websocket.Conn, p *w.Peers) {
	ticker := time.NewTicker(time.Second * 1)
	defer ticker.Stop()
	defer c.Close()

	for {
		select {
		case <-ticker.C:
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write([]byte(fmt.Sprintf("%d", len(p.Connections))))
		}
	}
}
