package handlers

import (
	"fmt"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	guuid "github.com/google/uuid"
)

func RoomCreate(c *fiber.Ctx) error {
	return c.Redirect(fmt.Sprintf("/room/%s", guuid.New().String()))
}

func Room(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		c.Status(400)
		return nil
	}

	uuid, suuid, room := createOrGetRoom(uuid)
	fmt.Sprintf("Room: %s", room.UUID, " Stream: %s", suuid)
	return nil
}

func RoomWebsocket(c *websocket.Conn) {
	uuid := c.Params("uuid")
	if uuid == "" {
		return
	}

	_, _, room := createOrGetRoom(uuid)
	fmt.Sprintf("Room: %s", room.UUID)

	// return c.SendString("Welcome to the API")
}

type room struct {
	UUID string
}

func createOrGetRoom(uuid string) (string, string, *room) {
	return uuid, "", nil
}
