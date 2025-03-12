# Multiplayer Snake Game - Connection Guide

## For the Host (You)

1. **Start the server**:

   ```bash
   ./start-server.sh
   ```

   or

   ```bash
   node server.js
   ```

2. **Find your IP address**:

   - On Windows: Open Command Prompt and type `ipconfig`
   - On Mac/Linux: Open Terminal and type `ifconfig` or `ip addr`
   - Look for your local IP address (usually starts with 192.168.x.x or 10.0.x.x)

3. **Create a room**:

   - Open your browser and go to `http://localhost:3000`
   - Click "Create Room"
   - You'll see a Room ID - share this with your friend

4. **Share connection details with your friend**:
   - Your IP address (e.g., 192.168.1.100)
   - The port (3000)
   - The Room ID (e.g., a1b2c3d4)

## For Your Friend

1. **Connect to your game**:

   - Open a browser and go to `http://YOUR_IP_ADDRESS:3000`
   - Replace YOUR_IP_ADDRESS with the IP address you shared
   - Example: `http://192.168.1.100:3000`

2. **Join your room**:
   - Click "Join Room"
   - Enter the Room ID you shared
   - Click "Join Game"

## Troubleshooting

If your friend can't connect:

1. **Test the connection**:

   - Have your friend go to `http://YOUR_IP_ADDRESS:3000/test.html`
   - Click "Connect to WebSocket"
   - If it shows "Connected" in green, the WebSocket connection works
   - If it fails, check the error message

2. **Check firewall settings**:

   - Make sure your firewall allows connections on port 3000
   - You might need to add an exception in your firewall settings

3. **Try port forwarding** (if connecting from outside your network):

   - Set up port forwarding on your router for port 3000
   - Share your public IP address instead of local IP

4. **Use a service like ngrok** (easiest solution for external connections):
   - Install ngrok: `npm install -g ngrok`
   - Run: `ngrok http 3000`
   - Share the https URL ngrok provides
   - Your friend can use this URL to connect from anywhere
