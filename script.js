// DOM Elements
const playBoard = document.querySelector(".play-board");
const playerScoreElement = document.getElementById("playerScore");
const opponentScoreElement = document.getElementById("opponentScore");
const playerIndicator = document.getElementById("playerIndicator");
const playerColor = document.getElementById("playerColor");
const controls = document.querySelectorAll(".control-button");

// Menu Elements
const multiplayerMenu = document.getElementById("multiplayerMenu");
const gameBoard = document.getElementById("gameBoard");
const gameStatus = document.getElementById("gameStatus");
const statusMessage = document.getElementById("statusMessage");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const joinForm = document.getElementById("joinForm");
const roomInfo = document.getElementById("roomInfo");
const roomIdInput = document.getElementById("roomIdInput");
const roomIdDisplay = document.getElementById("roomIdDisplay");
const joinGameBtn = document.getElementById("joinGameBtn");
const backBtn = document.getElementById("backBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

// Game variables
let gameOver = false;
let foodX, foodY;
let playerSnakeX = 5,
  playerSnakeY = 5;
let opponentSnakeX = 14,
  opponentSnakeY = 14;
let velocityX = 0,
  velocityY = 0;
let opponentVelocityX = 0,
  opponentVelocityY = 0;
let playerSnakeBody = [];
let opponentSnakeBody = [];
let gameInterval;
let score = 0;
let opponentScore = 0;
let playerId = "";
let roomId = "";
let socket;

// WebSocket connection
const connectWebSocket = () => {
  try {
    // Show connecting status to user
    showStatus("Connecting to server...");

    // Use location.hostname to make it work both locally and when deployed
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // For local development, hardcode to localhost:3000 if needed
    const host =
      window.location.hostname === "" ? "localhost:3000" : window.location.host;
    const wsUrl = `${protocol}//${host}`;

    console.log("Attempting to connect to WebSocket at:", wsUrl);

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      // Hide status message when connected
      gameStatus.style.display = "none";
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        showStatus("Error processing server message. Please refresh the page.");
      }
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      showStatus("Connection to server lost. Please refresh the page.");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      showStatus(
        "Connection error. Please check if the server is running and refresh the page."
      );
    };

    return true;
  } catch (error) {
    console.error("Error setting up WebSocket:", error);
    showStatus("Failed to connect to server. Please refresh and try again.");
    return false;
  }
};

// Handle WebSocket messages
const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case "room-created":
      roomId = data.roomId;
      playerId = data.playerId;
      console.log("Room created with ID:", roomId);
      showRoomInfo();
      break;

    case "game-ready":
      if (data.playerId) {
        playerId = data.playerId;
      }

      console.log("Game ready, player ID:", playerId);

      // Initialize game with received state
      const gameState = data.gameState;
      initializeGameState(gameState);
      startGame();
      break;

    case "opponent-update":
      // Update opponent's direction
      opponentVelocityX = data.velocityX;
      opponentVelocityY = data.velocityY;
      break;

    case "game-sync":
      // Update opponent's state
      if (playerId === "player1") {
        opponentSnakeX = data.opponent.x;
        opponentSnakeY = data.opponent.y;
        opponentSnakeBody = data.opponent.body;
        opponentScore = data.opponent.score;
        opponentScoreElement.innerText = `Opponent: ${opponentScore}`;
      } else {
        opponentSnakeX = data.opponent.x;
        opponentSnakeY = data.opponent.y;
        opponentSnakeBody = data.opponent.body;
        opponentScore = data.opponent.score;
        opponentScoreElement.innerText = `Opponent: ${opponentScore}`;
      }

      // Update food if it was changed by the opponent
      if (data.food && (foodX !== data.food.x || foodY !== data.food.y)) {
        foodX = data.food.x;
        foodY = data.food.y;
      }
      break;

    case "opponent-game-over":
      showStatus("You win! Your opponent crashed.");
      clearInterval(gameInterval);
      break;

    case "opponent-disconnected":
      clearInterval(gameInterval);
      showStatus("Your opponent disconnected.");
      break;

    case "error":
      console.error("Server error:", data.message);
      alert(data.message);
      break;

    default:
      console.warn("Unknown message type received:", data.type);
  }
};

// Initialize game state from server data
const initializeGameState = (gameState) => {
  foodX = gameState.food.x;
  foodY = gameState.food.y;

  if (playerId === "player1") {
    playerSnakeX = gameState.player1.x;
    playerSnakeY = gameState.player1.y;
    playerSnakeBody = gameState.player1.body;

    opponentSnakeX = gameState.player2.x;
    opponentSnakeY = gameState.player2.y;
    opponentSnakeBody = gameState.player2.body;

    // Set player indicator color
    playerColor.style.background = "#4a752c";
  } else {
    playerSnakeX = gameState.player2.x;
    playerSnakeY = gameState.player2.y;
    playerSnakeBody = gameState.player2.body;

    opponentSnakeX = gameState.player1.x;
    opponentSnakeY = gameState.player1.y;
    opponentSnakeBody = gameState.player1.body;

    // Set player indicator color
    playerColor.style.background = "#2c4a75";
  }
};

// Update food position randomly
const updateFoodPosition = () => {
  // Generate random position between 1-18
  const newFoodX = Math.floor(Math.random() * 18) + 1;
  const newFoodY = Math.floor(Math.random() * 18) + 1;

  // Check if food is on a snake body
  const isOnPlayerSnake = playerSnakeBody.some(
    (segment) => segment[0] === newFoodY && segment[1] === newFoodX
  );

  const isOnOpponentSnake = opponentSnakeBody.some(
    (segment) => segment[0] === newFoodY && segment[1] === newFoodX
  );

  // If food is on a snake, try again
  if (
    isOnPlayerSnake ||
    isOnOpponentSnake ||
    (playerSnakeX === newFoodX && playerSnakeY === newFoodY) ||
    (opponentSnakeX === newFoodX && opponentSnakeY === newFoodY)
  ) {
    updateFoodPosition();
  } else {
    foodX = newFoodX;
    foodY = newFoodY;

    // Send new food position to server
    socket.send(
      JSON.stringify({
        type: "game-update",
        playerId: playerId,
        playerState: getPlayerState(),
        newFood: { x: foodX, y: foodY },
      })
    );
  }
};

// Handle game over
const handleGameOver = () => {
  clearInterval(gameInterval);

  // Notify opponent
  socket.send(
    JSON.stringify({
      type: "game-over",
      playerId: playerId,
    })
  );

  showStatus("Game Over! You crashed.");
};

// Change direction on key press
const changeDirection = (e) => {
  // Change velocity based on key press
  if (e.key === "ArrowUp" && velocityY !== 1) {
    velocityX = 0;
    velocityY = -1;
  } else if (e.key === "ArrowDown" && velocityY !== -1) {
    velocityX = 0;
    velocityY = 1;
  } else if (e.key === "ArrowLeft" && velocityX !== 1) {
    velocityX = -1;
    velocityY = 0;
  } else if (e.key === "ArrowRight" && velocityX !== -1) {
    velocityX = 1;
    velocityY = 0;
  }

  // Send direction update to server
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "update-direction",
        playerId: playerId,
        velocityX: velocityX,
        velocityY: velocityY,
      })
    );
  }
};

// Get current player state
const getPlayerState = () => {
  return {
    x: playerSnakeX,
    y: playerSnakeY,
    velocityX: velocityX,
    velocityY: velocityY,
    body: playerSnakeBody,
    score: score,
  };
};

// Handle control buttons
controls.forEach((button) =>
  button.addEventListener("click", () =>
    changeDirection({ key: button.dataset.key })
  )
);

// Initialize game
const initGame = () => {
  if (gameOver) return handleGameOver();

  // Create food and snake elements in HTML
  let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

  // When player snake eats food
  if (playerSnakeX === foodX && playerSnakeY === foodY) {
    updateFoodPosition();
    playerSnakeBody.push([foodY, foodX]); // Add food position to snake body
    score++;

    playerScoreElement.innerText = `Score: ${score}`;

    // Send updated state to server
    socket.send(
      JSON.stringify({
        type: "game-update",
        playerId: playerId,
        playerState: getPlayerState(),
      })
    );
  }

  // Update player snake position based on velocity
  playerSnakeX += velocityX;
  playerSnakeY += velocityY;

  // Update opponent snake position based on velocity
  opponentSnakeX += opponentVelocityX;
  opponentSnakeY += opponentVelocityY;

  // Shift elements in player snake body by one
  for (let i = playerSnakeBody.length - 1; i > 0; i--) {
    playerSnakeBody[i] = playerSnakeBody[i - 1];
  }

  // Set first element of player snake body to current snake position
  if (playerSnakeBody.length) {
    playerSnakeBody[0] = [playerSnakeY, playerSnakeX];
  }

  // Check if player snake hits wall
  if (
    playerSnakeX <= 0 ||
    playerSnakeX > 18 ||
    playerSnakeY <= 0 ||
    playerSnakeY > 18
  ) {
    gameOver = true;
  }

  // Player snake classes based on player ID
  const playerHeadClass =
    playerId === "player1" ? "snake-head-p1" : "snake-head-p2";
  const playerBodyClass =
    playerId === "player1" ? "snake-body-p1" : "snake-body-p2";

  // Opponent snake classes based on player ID
  const opponentHeadClass =
    playerId === "player1" ? "snake-head-p2" : "snake-head-p1";
  const opponentBodyClass =
    playerId === "player1" ? "snake-body-p2" : "snake-body-p1";

  // Add div for player snake head
  html += `<div class="${playerHeadClass}" style="grid-area: ${playerSnakeY} / ${playerSnakeX}"></div>`;

  // Add div for opponent snake head
  html += `<div class="${opponentHeadClass}" style="grid-area: ${opponentSnakeY} / ${opponentSnakeX}"></div>`;

  // Add divs for player snake body
  for (let i = 0; i < playerSnakeBody.length; i++) {
    html += `<div class="${playerBodyClass}" style="grid-area: ${playerSnakeBody[i][0]} / ${playerSnakeBody[i][1]}"></div>`;

    // Check if player snake head hits its own body
    if (
      i !== 0 &&
      playerSnakeBody[0][0] === playerSnakeBody[i][0] &&
      playerSnakeBody[0][1] === playerSnakeBody[i][1]
    ) {
      gameOver = true;
    }

    // Check if player snake head hits opponent snake body
    if (opponentSnakeBody.length > 0) {
      if (
        playerSnakeY === opponentSnakeBody[i]?.[0] &&
        playerSnakeX === opponentSnakeBody[i]?.[1]
      ) {
        gameOver = true;
      }
    }
  }

  // Add divs for opponent snake body
  for (let i = 0; i < opponentSnakeBody.length; i++) {
    if (opponentSnakeBody[i]) {
      html += `<div class="${opponentBodyClass}" style="grid-area: ${opponentSnakeBody[i][0]} / ${opponentSnakeBody[i][1]}"></div>`;

      // Check if player snake head hits opponent snake body
      if (
        playerSnakeY === opponentSnakeBody[i][0] &&
        playerSnakeX === opponentSnakeBody[i][1]
      ) {
        gameOver = true;
      }
    }
  }

  // Check if player snake head hits opponent snake head
  if (playerSnakeX === opponentSnakeX && playerSnakeY === opponentSnakeY) {
    gameOver = true;
  }

  playBoard.innerHTML = html;

  // Send regular updates to server
  if (velocityX !== 0 || velocityY !== 0) {
    socket.send(
      JSON.stringify({
        type: "game-update",
        playerId: playerId,
        playerState: getPlayerState(),
      })
    );
  }
};

// Start the game
const startGame = () => {
  gameOver = false;
  multiplayerMenu.style.display = "none";
  gameBoard.style.display = "block";
  gameStatus.style.display = "none";

  // Set game refresh rate
  gameInterval = setInterval(initGame, 150);
};

// Show room info
const showRoomInfo = () => {
  multiplayerMenu.querySelector(".menu-buttons").style.display = "none";
  joinForm.style.display = "none";
  roomInfo.style.display = "block";
  roomIdDisplay.textContent = roomId;
  gameStatus.style.display = "none"; // Hide any status messages
};

// Show join form
const showJoinForm = () => {
  multiplayerMenu.querySelector(".menu-buttons").style.display = "none";
  joinForm.style.display = "block";
  roomInfo.style.display = "none";
};

// Show status message
const showStatus = (message) => {
  gameStatus.style.display = "block";
  statusMessage.textContent = message;
};

// Event listeners for menu buttons
createRoomBtn.addEventListener("click", () => {
  // Disable button to prevent multiple clicks
  createRoomBtn.disabled = true;

  if (connectWebSocket()) {
    // Wait for socket to open
    const waitForSocketConnection = (callback) => {
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          console.log("Socket is open, sending create-room request");
          callback();
          createRoomBtn.disabled = false;
        } else if (socket.readyState === WebSocket.CONNECTING) {
          console.log("Still connecting to WebSocket server...");
          waitForSocketConnection(callback);
        } else {
          console.error("Socket failed to connect, state:", socket.readyState);
          showStatus(
            "Failed to connect to server. Please refresh and try again."
          );
          createRoomBtn.disabled = false;
        }
      }, 100);
    };

    waitForSocketConnection(() => {
      try {
        socket.send(
          JSON.stringify({
            type: "create-room",
          })
        );
      } catch (error) {
        console.error("Error sending create-room message:", error);
        showStatus("Error creating room. Please refresh and try again.");
        createRoomBtn.disabled = false;
      }
    });
  } else {
    createRoomBtn.disabled = false;
  }
});

joinRoomBtn.addEventListener("click", showJoinForm);

joinGameBtn.addEventListener("click", () => {
  const roomIdValue = roomIdInput.value.trim();

  if (roomIdValue) {
    connectWebSocket();

    // Wait for socket to open
    const waitForSocketConnection = (callback) => {
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          callback();
        } else {
          waitForSocketConnection(callback);
        }
      }, 100);
    };

    waitForSocketConnection(() => {
      socket.send(
        JSON.stringify({
          type: "join-room",
          roomId: roomIdValue,
        })
      );
    });
  } else {
    alert("Please enter a valid Room ID");
  }
});

backBtn.addEventListener("click", () => {
  multiplayerMenu.querySelector(".menu-buttons").style.display = "flex";
  joinForm.style.display = "none";
});

playAgainBtn.addEventListener("click", () => {
  location.reload();
});

// Listen for key presses
document.addEventListener("keyup", changeDirection);

// Mobile swipe controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener("touchend", (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // Determine swipe direction based on which axis had greater movement
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      changeDirection({ key: "ArrowRight" });
    } else {
      changeDirection({ key: "ArrowLeft" });
    }
  } else {
    if (diffY > 0) {
      changeDirection({ key: "ArrowDown" });
    } else {
      changeDirection({ key: "ArrowUp" });
    }
  }
});
