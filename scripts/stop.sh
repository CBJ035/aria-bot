#!/bin/bash

# Aria Bot Stop Script
# Gracefully stop the background bot process

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$BOT_DIR/bot.pid"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo -e "${BLUE}⏹️  Stopping Aria Bot...${NC}"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  Bot is not running (no PID file found)${NC}"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Bot process not found (stale PID file)${NC}"
    rm -f "$PID_FILE"
    exit 1
fi

echo -e "${BLUE}🔄 Sending SIGTERM to process $PID...${NC}"
kill -TERM "$PID"

# Wait for graceful shutdown
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bot stopped gracefully${NC}"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo -e "${YELLOW}⚠️  Forcing shutdown...${NC}"
kill -KILL "$PID" 2>/dev/null

if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to stop bot process${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Bot stopped (forced)${NC}"
    rm -f "$PID_FILE"
fi
