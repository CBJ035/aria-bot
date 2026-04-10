#!/bin/bash

# Aria Bot Startup Script
# Modern Discord Music Bot

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$BOT_DIR/bot.pid"
LOG_DIR="$BOT_DIR/logs"
LOG_FILE="$LOG_DIR/bot.log"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
PURPLE='\\033[0;35m'
CYAN='\\033[0;36m'
WHITE='\\033[1;37m'
NC='\\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}                    ${WHITE}ARIA BOT STARTUP${NC}                              ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}                   ${CYAN}Discord Music Bot v3.0.0${NC}                          ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if bot is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Bot is already running (PID: $PID)${NC}"
        echo -e "${BLUE}💡 Use './scripts/stop.sh' to stop the bot first${NC}"
        exit 1
    else
        echo -e "${YELLOW}🧹 Cleaning up stale PID file${NC}"
        rm -f "$PID_FILE"
    fi
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${BLUE}💡 Please install Node.js 18.17.0 or higher${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"

if ! node -e "process.exit(process.versions.node.split('.').map(Number).some((v,i) => v > '$REQUIRED_VERSION'.split('.')[i] || (v === +('$REQUIRED_VERSION'.split('.')[i]) && i === 2)) ? 0 : 1)"; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old${NC}"
    echo -e "${BLUE}💡 Please update to Node.js $REQUIRED_VERSION or higher${NC}"
    exit 1
fi

# Check if config.json exists
if [ ! -f "$BOT_DIR/config.json" ]; then
    echo -e "${RED}❌ config.json not found${NC}"
    echo -e "${BLUE}💡 Run 'npm run setup' to configure the bot${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "$BOT_DIR/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    cd "$BOT_DIR"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🚀 Starting Aria Bot...${NC}"
echo -e "${CYAN}📁 Directory: $BOT_DIR${NC}"
echo -e "${CYAN}📄 Log file: $LOG_FILE${NC}"
echo ""

cd "$BOT_DIR"

# Start the bot
nohup node src/index.js > "$LOG_FILE" 2>&1 &
BOT_PID=$!

# Save PID
echo $BOT_PID > "$PID_FILE"

# Wait a moment to check if it started successfully
sleep 3

if ps -p $BOT_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bot started successfully!${NC}"
    echo -e "${CYAN}🆔 Process ID: $BOT_PID${NC}"
    echo -e "${CYAN}📊 Log file: $LOG_FILE${NC}"
    echo ""
    echo -e "${WHITE}💡 Useful commands:${NC}"
    echo -e "${BLUE}   • View logs: tail -f $LOG_FILE${NC}"
    echo -e "${BLUE}   • Stop bot: ./scripts/stop.sh${NC}"
    echo -e "${BLUE}   • Admin panel: npm run admin${NC}"
    echo ""
    echo -e "${GREEN}🎵 Bot is now running in the background!${NC}"
else
    echo -e "${RED}❌ Failed to start bot${NC}"
    echo -e "${BLUE}💡 Check the log file for details: $LOG_FILE${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
