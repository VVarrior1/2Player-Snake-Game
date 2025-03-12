# Multiplayer Snake Game

A real-time multiplayer Snake Game implemented with HTML, CSS, JavaScript, and WebSockets.

## Features

- Classic snake gameplay with multiplayer support
- Two players can play on the same board simultaneously
- Room-based system for connecting with friends via a shareable link
- Real-time synchronization of game state
- Responsive design for all screen sizes
- Touch controls for mobile devices
- On-screen control buttons

## How to Play

1. Clone or download this repository
2. Install dependencies with `npm install`
3. Start the server with `npm start`
4. Open `http://localhost:3000` in your web browser
5. Create a room and share the Room ID with a friend
6. Use arrow keys (on desktop) or on-screen buttons/swipes (on mobile) to control your snake
7. Eat the food (red dot) to grow and increase your score
8. Avoid hitting the walls, your own body, or the other player's snake

## Multiplayer Instructions

1. **Creating a Room**: Click "Create Room" to generate a unique Room ID
2. **Joining a Room**: Click "Join Room" and enter the Room ID shared by your friend
3. **Player Colors**:
   - Player 1 (room creator): Green snake
   - Player 2 (room joiner): Blue snake
4. **Game Rules**:
   - Each player controls their own snake
   - Both players compete for the same food
   - If your snake hits a wall, itself, or the other player's snake, you lose
   - The game ends when one player crashes

## Controls

- **Desktop:** Arrow keys (↑, ↓, ←, →)
- **Mobile:** On-screen buttons or swipe in the direction you want to move

## Technologies Used

- HTML5
- CSS3 (with Grid layout)
- JavaScript (ES6+)
- Node.js
- Express
- WebSockets (ws library)
- UUID for room ID generation

## Deployment

To deploy this game to a hosting service:

1. Make sure the hosting service supports Node.js
2. Upload all files to the server
3. Install dependencies with `npm install`
4. Start the server with `npm start` or use a process manager like PM2
5. Configure your domain to point to the server

## Preview

Start the server and open the application in your browser to play!
