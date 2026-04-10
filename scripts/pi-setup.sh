#!/bin/bash

# Aria Bot - Raspberry Pi 5 Setup Script
# This script automates the installation and configuration of Aria Bot on Raspberry Pi 5

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${CYAN}"
echo "  ___  ____  ___  ___  "
echo " / _ \|  _ \|_ _||_ _| "
echo "| | | | |_) | |   | |  "
echo "| |_| |  _ < | |   | |  "
echo " \___/|_| \_\|___||___| "
echo -e "${NC}"
echo -e "${GREEN}🎵 Aria Bot - Raspberry Pi 5 Setup${NC}"
echo -e "${BLUE}🚀 Automated installation and configuration${NC}"
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: This script is designed for Raspberry Pi${NC}"
    echo -e "${YELLOW}   Continue anyway? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo -e "${RED}❌ Please do not run this script as root${NC}"
    echo -e "${YELLOW}   Run as a regular user with sudo privileges${NC}"
    exit 1
fi

# Get current directory
BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BOT_DIR"

echo -e "${BLUE}📁 Bot directory: $BOT_DIR${NC}"
echo ""

# Function to print step headers
print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
    echo "----------------------------------------"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Step 1: System Update
print_step "Updating Raspberry Pi OS"
echo -e "${YELLOW}This may take a few minutes...${NC}"
sudo apt update && sudo apt upgrade -y
check_success "System updated"

# Step 2: Install essential packages
print_step "Installing essential packages"
sudo apt install -y curl wget git build-essential python3 python3-pip
check_success "Essential packages installed"

# Step 3: Install Node.js 18.x
print_step "Installing Node.js 18.x"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    check_success "Node.js installed"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}Upgrading Node.js to version 18...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        check_success "Node.js upgraded"
    else
        echo -e "${GREEN}✅ Node.js $NODE_VERSION already installed${NC}"
    fi
fi

# Step 4: Install FFmpeg
print_step "Installing FFmpeg"
if ! command -v ffmpeg &> /dev/null; then
    sudo apt install -y ffmpeg
    check_success "FFmpeg installed"
else
    echo -e "${GREEN}✅ FFmpeg already installed${NC}"
fi

# Step 5: Install additional audio dependencies
print_step "Installing audio dependencies"
sudo apt install -y libasound2-dev libpulse-dev
check_success "Audio dependencies installed"

# Step 6: Install Node.js dependencies
print_step "Installing Node.js dependencies"
if [ -f "package.json" ]; then
    echo -e "${YELLOW}Installing dependencies (this may take several minutes)...${NC}"
    npm install --production
    check_success "Node.js dependencies installed"
else
    echo -e "${RED}❌ package.json not found in current directory${NC}"
    exit 1
fi

# Step 7: Create systemd service
print_step "Creating systemd service"
sudo tee /etc/systemd/system/aria-bot.service > /dev/null <<EOF
[Unit]
Description=Aria Discord Music Bot
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BOT_DIR
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=aria-bot

# Environment variables
Environment=NODE_ENV=production
Environment=LOG_LEVEL=info

# Resource limits for Raspberry Pi
MemoryMax=512M
CPUQuota=50%

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$BOT_DIR

[Install]
WantedBy=multi-user.target
EOF

check_success "Systemd service created"

# Step 8: Enable and start service
print_step "Enabling systemd service"
sudo systemctl daemon-reload
sudo systemctl enable aria-bot
check_success "Service enabled"

# Step 9: Create log rotation
print_step "Setting up log rotation"
sudo tee /etc/logrotate.d/aria-bot > /dev/null <<EOF
$BOT_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload aria-bot > /dev/null 2>&1 || true
    endscript
}
EOF

check_success "Log rotation configured"

# Step 10: Set up firewall (optional)
print_step "Configuring firewall"
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Setting up UFW firewall rules...${NC}"
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 3000/tcp comment "Aria Bot Admin Panel"
    check_success "Firewall configured"
else
    echo -e "${YELLOW}UFW not installed, skipping firewall configuration${NC}"
fi

# Step 11: Create management scripts
print_step "Creating management scripts"

# Create start script
cat > start-aria.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Aria Bot..."
sudo systemctl start aria-bot
sudo systemctl status aria-bot --no-pager
EOF

# Create stop script
cat > stop-aria.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Aria Bot..."
sudo systemctl stop aria-bot
echo "✅ Aria Bot stopped"
EOF

# Create restart script
cat > restart-aria.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Aria Bot..."
sudo systemctl restart aria-bot
sudo systemctl status aria-bot --no-pager
EOF

# Create status script
cat > status-aria.sh << 'EOF'
#!/bin/bash
echo "📊 Aria Bot Status:"
sudo systemctl status aria-bot --no-pager
echo ""
echo "📄 Recent logs:"
sudo journalctl -u aria-bot --no-pager -n 20
EOF

# Create logs script
cat > logs-aria.sh << 'EOF'
#!/bin/bash
echo "📄 Aria Bot Logs (Press Ctrl+C to exit):"
sudo journalctl -u aria-bot -f
EOF

# Make scripts executable
chmod +x start-aria.sh stop-aria.sh restart-aria.sh status-aria.sh logs-aria.sh
check_success "Management scripts created"

# Step 12: Create configuration backup
print_step "Creating configuration backup"
if [ -f "config.json" ]; then
    cp config.json config.json.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Configuration backed up${NC}"
fi

# Step 13: Final setup
print_step "Final configuration"
echo -e "${YELLOW}Setting proper permissions...${NC}"
sudo chown -R $USER:$USER "$BOT_DIR"
chmod +x scripts/*.sh

# Create logs directory if it doesn't exist
mkdir -p logs
check_success "Permissions and directories set"

# Step 14: Display completion message
echo ""
echo -e "${GREEN}🎉 Aria Bot setup completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "${YELLOW}1.${NC} Configure your bot: ${BLUE}npm run setup${NC}"
echo -e "${YELLOW}2.${NC} Start the bot: ${BLUE}./start-aria.sh${NC}"
echo -e "${YELLOW}3.${NC} Check status: ${BLUE}./status-aria.sh${NC}"
echo -e "${YELLOW}4.${NC} View logs: ${BLUE}./logs-aria.sh${NC}"
echo ""
echo -e "${CYAN}🛠️  Management Commands:${NC}"
echo -e "  • Start:   ${BLUE}./start-aria.sh${NC}"
echo -e "  • Stop:    ${BLUE}./stop-aria.sh${NC}"
echo -e "  • Restart: ${BLUE}./restart-aria.sh${NC}"
echo -e "  • Status:  ${BLUE}./status-aria.sh${NC}"
echo -e "  • Logs:    ${BLUE}./logs-aria.sh${NC}"
echo ""
echo -e "${CYAN}🔧 System Service:${NC}"
echo -e "  • Enable auto-start:  ${BLUE}sudo systemctl enable aria-bot${NC}"
echo -e "  • Disable auto-start: ${BLUE}sudo systemctl disable aria-bot${NC}"
echo -e "  • Service status:     ${BLUE}sudo systemctl status aria-bot${NC}"
echo ""
echo -e "${GREEN}🎵 Your Aria Bot is ready for Raspberry Pi 5!${NC}"
echo -e "${PURPLE}   The bot will automatically start on boot${NC}"
echo ""
