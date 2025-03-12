const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, "/")));

// Add a simple route to check if server is running
app.get("/health", (req, res) => {
  res.status(200).send("Server is running");
});

// Store active game rooms
const gameRooms = new Map();

// Log active connections and rooms periodically
setInterval(() => {
  console.log(
    `Active connections: ${wss.clients.size}, Active rooms: ${gameRooms.size}`
  );
}, 30000);

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  console.log(`New connection from ${req.socket.remoteAddress}`);

  let roomId = "";
  let playerId = "";

  // Send a welcome message to confirm connection
  try {
    ws.send(
      JSON.stringify({
        type: "connection-established",
        message: "Connected to server",
      })
    );
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type}`);

      switch (data.type) {
        case "create-room":
          // Generate a new room ID
          roomId = uuidv4().substring(0, 8);
          playerId = "player1";
          console.log(`Creating room: ${roomId}`);

          // Create a new game room
          gameRooms.set(roomId, {
            player1: ws,
            player2: null,
            gameState: {
              food: generateFoodPosition(),
              player1: {
                x: 5,
                y: 5,
                velocityX: 0,
                velocityY: 0,
                body: [],
                score: 0,
              },
              player2: {
                x: 14,
                y: 14,
                velocityX: 0,
                velocityY: 0,
                body: [],
                score: 0,
              },
            },
          });

          // Send room ID to creator
          try {
            ws.send(
              JSON.stringify({
                type: "room-created",
                roomId: roomId,
                playerId: playerId,
              })
            );
            console.log(`Room ${roomId} created and notification sent`);
          } catch (error) {
            console.error(
              `Error sending room-created message for room ${roomId}:`,
              error
            );
          }
          break;

        case "join-room":
          roomId = data.roomId;
          playerId = "player2";
          console.log(`Attempting to join room: ${roomId}`);

          // Check if room exists and is not full
          if (gameRooms.has(roomId) && !gameRooms.get(roomId).player2) {
            const room = gameRooms.get(roomId);
            room.player2 = ws;
            console.log(`Player 2 joined room: ${roomId}`);

            // Notify both players that game is ready
            const gameReadyMsg = JSON.stringify({
              type: "game-ready",
              gameState: room.gameState,
            });

            try {
              room.player1.send(gameReadyMsg);
              console.log(
                `Game-ready message sent to player 1 in room ${roomId}`
              );
            } catch (error) {
              console.error(
                `Error sending game-ready to player 1 in room ${roomId}:`,
                error
              );
            }

            try {
              room.player2.send(
                JSON.stringify({
                  type: "game-ready",
                  gameState: room.gameState,
                  playerId: playerId,
                })
              );
              console.log(
                `Game-ready message sent to player 2 in room ${roomId}`
              );
            } catch (error) {
              console.error(
                `Error sending game-ready to player 2 in room ${roomId}:`,
                error
              );
            }
          } else {
            // Room doesn't exist or is full
            console.log(
              `Failed to join room ${roomId}: room not found or full`
            );
            try {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found or is full",
                })
              );
            } catch (error) {
              console.error(`Error sending room-not-found message:`, error);
            }
          }
          break;

        case "update-direction":
          if (gameRooms.has(roomId)) {
            const room = gameRooms.get(roomId);
            const player = data.playerId;

            // Update player direction
            if (player === "player1" && room.player1) {
              room.gameState.player1.velocityX = data.velocityX;
              room.gameState.player1.velocityY = data.velocityY;

              // Forward to other player
              if (room.player2) {
                try {
                  room.player2.send(
                    JSON.stringify({
                      type: "opponent-update",
                      velocityX: data.velocityX,
                      velocityY: data.velocityY,
                    })
                  );
                } catch (error) {
                  console.error(
                    `Error forwarding direction update to player 2:`,
                    error
                  );
                }
              }
            } else if (player === "player2" && room.player2) {
              room.gameState.player2.velocityX = data.velocityX;
              room.gameState.player2.velocityY = data.velocityY;

              // Forward to other player
              if (room.player1) {
                try {
                  room.player1.send(
                    JSON.stringify({
                      type: "opponent-update",
                      velocityX: data.velocityX,
                      velocityY: data.velocityY,
                    })
                  );
                } catch (error) {
                  console.error(
                    `Error forwarding direction update to player 1:`,
                    error
                  );
                }
              }
            }
          }
          break;

        case "game-update":
          if (gameRooms.has(roomId)) {
            const room = gameRooms.get(roomId);

            // Update game state based on player
            if (data.playerId === "player1" && room.player2) {
              room.gameState.player1 = data.playerState;
              if (data.newFood) {
                room.gameState.food = data.newFood;
              }

              // Send update to player 2
              try {
                room.player2.send(
                  JSON.stringify({
                    type: "game-sync",
                    opponent: data.playerState,
                    food: data.newFood || room.gameState.food,
                  })
                );
              } catch (error) {
                console.error(`Error sending game update to player 2:`, error);
              }
            } else if (data.playerId === "player2" && room.player1) {
              room.gameState.player2 = data.playerState;
              if (data.newFood) {
                room.gameState.food = data.newFood;
              }

              // Send update to player 1
              try {
                room.player1.send(
                  JSON.stringify({
                    type: "game-sync",
                    opponent: data.playerState,
                    food: data.newFood || room.gameState.food,
                  })
                );
              } catch (error) {
                console.error(`Error sending game update to player 1:`, error);
              }
            }
          }
          break;

        case "game-over":
          if (gameRooms.has(roomId)) {
            const room = gameRooms.get(roomId);
            const otherPlayer =
              data.playerId === "player1" ? room.player2 : room.player1;

            if (otherPlayer) {
              try {
                otherPlayer.send(
                  JSON.stringify({
                    type: "opponent-game-over",
                  })
                );
                console.log(
                  `Game over notification sent to opponent in room ${roomId}`
                );
              } catch (error) {
                console.error(`Error sending game-over notification:`, error);
              }
            }
          }
          break;

        default:
          console.warn(`Unknown message type received: ${data.type}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle disconnection
  ws.on("close", (code, reason) => {
    console.log(
      `Connection closed: ${code} ${reason}, Room: ${roomId}, Player: ${playerId}`
    );

    if (roomId && gameRooms.has(roomId)) {
      const room = gameRooms.get(roomId);

      // Notify other player about disconnection
      if (playerId === "player1" && room.player2) {
        try {
          room.player2.send(
            JSON.stringify({
              type: "opponent-disconnected",
            })
          );
          console.log(
            `Disconnection notification sent to player 2 in room ${roomId}`
          );
        } catch (error) {
          console.error(
            `Error sending disconnection notification to player 2:`,
            error
          );
        }
      } else if (playerId === "player2" && room.player1) {
        try {
          room.player1.send(
            JSON.stringify({
              type: "opponent-disconnected",
            })
          );
          console.log(
            `Disconnection notification sent to player 1 in room ${roomId}`
          );
        } catch (error) {
          console.error(
            `Error sending disconnection notification to player 1:`,
            error
          );
        }
      }

      // Remove room if both players disconnected
      if (
        (playerId === "player1" && !room.player2) ||
        (playerId === "player2" && !room.player1)
      ) {
        gameRooms.delete(roomId);
        console.log(`Room ${roomId} deleted as both players disconnected`);
      } else {
        // Update room with disconnected player
        if (playerId === "player1") {
          room.player1 = null;
          console.log(`Player 1 removed from room ${roomId}`);
        } else if (playerId === "player2") {
          room.player2 = null;
          console.log(`Player 2 removed from room ${roomId}`);
        }
      }
    }
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error.message}`);
  });
});

// Generate random food position
function generateFoodPosition() {
  return {
    x: Math.floor(Math.random() * 18) + 1,
    y: Math.floor(Math.random() * 18) + 1,
  };
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
