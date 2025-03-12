#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
if [ -z "$LOCAL_IP" ]; then
    # Try alternative command if ifconfig is not available
    LOCAL_IP=$(ip addr | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n 1)
fi

echo -e "${GREEN}Starting server...${NC}"
echo -e "Once the server is running, you can:"
echo -e "1. Open ${YELLOW}http://localhost:3000${NC} in your browser"
echo -e "2. Test WebSocket connection at ${YELLOW}http://localhost:3000/test.html${NC}"

if [ ! -z "$LOCAL_IP" ]; then
    echo -e "3. Connect from other devices on your network using ${YELLOW}http://$LOCAL_IP:3000${NC}"
fi

echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${GREEN}=== Server Logs ===${NC}"

# Start the server
node server.js 