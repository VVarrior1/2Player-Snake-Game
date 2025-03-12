#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Multiplayer Snake Game Server Starter ===${NC}"
echo "This script will help you start the server and troubleshoot connection issues."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    echo "Please install npm (it usually comes with Node.js)"
    exit 1
fi

# Check if required packages are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies.${NC}"
        exit 1
    fi
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo -e "${RED}Error: server.js not found.${NC}"
    echo "Make sure you're in the correct directory."
    exit 1
fi

# Get local IP address for easier connection from other devices
LOCAL_IP=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
if [ -z "$LOCAL_IP" ]; then
    # Try alternative command if ifconfig is not available
    LOCAL_IP=$(ip addr 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n 1)
fi

echo -e "${GREEN}Starting server...${NC}"
echo -e "\n${BLUE}=== FOR YOU (HOST) ===${NC}"
echo -e "1. Open ${YELLOW}http://localhost:3000${NC} in your browser"
echo -e "2. Click 'Create Room' and note the Room ID"
echo -e "3. Share the Room ID with your friend"

if [ ! -z "$LOCAL_IP" ]; then
    echo -e "\n${BLUE}=== FOR YOUR FRIEND ===${NC}"
    echo -e "Tell your friend to:"
    echo -e "1. Open ${YELLOW}http://$LOCAL_IP:3000${NC} in their browser"
    echo -e "2. Click 'Join Room'"
    echo -e "3. Enter the Room ID you shared"
    echo -e "4. Click 'Join Game'"
    
    echo -e "\n${BLUE}=== TROUBLESHOOTING ===${NC}"
    echo -e "If your friend can't connect:"
    echo -e "1. Have them test the connection at ${YELLOW}http://$LOCAL_IP:3000/test.html${NC}"
    echo -e "2. Make sure you're on the same network"
    echo -e "3. Check if your firewall is blocking connections on port 3000"
    echo -e "4. For connections outside your network, consider using ngrok:"
    echo -e "   ${YELLOW}npm install -g ngrok${NC}"
    echo -e "   ${YELLOW}ngrok http 3000${NC}"
else
    echo -e "\n${YELLOW}Could not determine your local IP address.${NC}"
    echo -e "You may need to find it manually to share with your friend."
fi

echo -e "\n${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${GREEN}=== Server Logs ===${NC}"

# Start the server
node server.js 