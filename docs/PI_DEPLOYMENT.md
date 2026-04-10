# 🍓 Aria Bot - Raspberry Pi 5 Deployment Guide

This guide walks you through deploying Aria Bot on your Raspberry Pi 5 step by step.

## 🚀 Quick Deployment (5 minutes)

### Prerequisites
- Raspberry Pi 5 with Raspberry Pi OS 64-bit
- Internet connection
- SSH access (optional but recommended)

### Step 1: Connect to Your Pi
```bash
# Via SSH (recommended)
ssh pi@your-pi-ip-address

# Or connect directly with keyboard/monitor
```

### Step 2: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/aria-bot.git
cd aria-bot

# Make setup script executable
chmod +x scripts/pi-setup.sh

# Run automated setup
./scripts/pi-setup.sh
```

### Step 3: Configure Bot
```bash
# Run the configuration wizard
npm run setup

# Enter your Discord bot token and other details
```

### Step 4: Start Bot
```bash
# Start the bot
./start-aria.sh

# Check status
./status-aria.sh
```

**That's it! Your bot is now running on your Raspberry Pi 5! 🎉**

## 📋 Detailed Deployment

### System Preparation

#### 1. Update Raspberry Pi OS
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

#### 2. Install Essential Packages
```bash
sudo apt install -y curl wget git build-essential python3 python3-pip
```

#### 3. Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version
```

#### 4. Install Audio Dependencies
```bash
sudo apt install -y ffmpeg alsa-utils pulseaudio libasound2-dev libpulse-dev

# Add user to audio group
sudo usermod -a -G audio $USER
```

### Bot Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/aria-bot.git
cd aria-bot
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Run Pi Optimizations
```bash
node scripts/pi-optimize.js
```

#### 4. Configure Bot
```bash
npm run setup
```

### Service Configuration

#### 1. Create Systemd Service
```bash
# Copy service file
sudo cp scripts/aria-bot.service /etc/systemd/system/

# Update paths in service file
sudo sed -i "s|/home/pi/aria-bot|$(pwd)|g" /etc/systemd/system/aria-bot.service
sudo sed -i "s|User=pi|User=$USER|g" /etc/systemd/system/aria-bot.service
sudo sed -i "s|Group=pi|Group=$USER|g" /etc/systemd/system/aria-bot.service

# Reload systemd
sudo systemctl daemon-reload
```

#### 2. Enable Auto-Start
```bash
sudo systemctl enable aria-bot
```

#### 3. Start Service
```bash
sudo systemctl start aria-bot
```

#### 4. Verify Service
```bash
sudo systemctl status aria-bot
```

## 🔧 Configuration

### Discord Bot Setup

#### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your bot (e.g., "Aria Bot")
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the bot token

#### 2. Set Bot Permissions
1. Go to "OAuth2" > "URL Generator"
2. Select "bot" scope
3. Select these permissions:
   - Send Messages
   - Use Slash Commands
   - Connect
   - Speak
   - Use Voice Activity
   - Embed Links
   - Attach Files
   - Read Message History
4. Copy the generated URL
5. Open URL in browser to invite bot to server

#### 3. Configure Bot
```bash
# Run configuration wizard
npm run setup

# Or edit config.json manually
nano config.json
```

### Spotify Integration (Optional)

#### 1. Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in app details
4. Copy Client ID and Client Secret

#### 2. Add to Configuration
```json
{
    "spotify": {
        "clientId": "your_spotify_client_id",
        "clientSecret": "your_spotify_client_secret"
    }
}
```

## 🎛️ Management

### Service Management
```bash
# Start bot
sudo systemctl start aria-bot

# Stop bot
sudo systemctl stop aria-bot

# Restart bot
sudo systemctl restart aria-bot

# Check status
sudo systemctl status aria-bot

# View logs
sudo journalctl -u aria-bot -f
```

### Using Management Scripts
```bash
# Start bot
./start-aria.sh

# Stop bot
./stop-aria.sh

# Restart bot
./restart-aria.sh

# Check status
./status-aria.sh

# View logs
./logs-aria.sh

# Monitor performance
./monitor-pi.sh
```

## 🔍 Troubleshooting

### Common Issues

#### Bot Won't Start
```bash
# Check logs
sudo journalctl -u aria-bot -n 50

# Check configuration
node -e "console.log(require('./config.json'))"

# Test manual start
node src/index.js
```

#### No Audio Output
```bash
# Test audio
speaker-test -t wav -c 2

# Check audio devices
aplay -l

# Run audio optimization
./scripts/optimize-audio.sh
```

#### High Memory Usage
```bash
# Use Pi-optimized start
./start-pi.sh

# Monitor memory
./monitor-pi.sh

# Check configuration
grep -A 5 "pi:" config.json
```

### Performance Optimization

#### Memory Optimization
```bash
# Set memory limits
export NODE_OPTIONS="--max-old-space-size=512"

# Use Pi config
cp config.pi.json config.json
```

#### CPU Optimization
```bash
# Set CPU governor
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Monitor temperature
vcgencmd measure_temp
```

## 📊 Monitoring

### System Monitoring
```bash
# Check system resources
htop

# Monitor memory
watch -n 1 'free -h'

# Check temperature
watch -n 5 vcgencmd measure_temp

# Monitor disk usage
df -h
```

### Bot Monitoring
```bash
# Monitor bot performance
./monitor-pi.sh

# Check bot logs
tail -f logs/bot.log

# Check systemd logs
sudo journalctl -u aria-bot -f
```

## 🔒 Security

### Firewall Setup
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow admin panel (if enabled)
sudo ufw allow 3000/tcp
```

### User Permissions
```bash
# Ensure proper ownership
sudo chown -R $USER:$USER /path/to/aria-bot

# Set proper permissions
chmod 755 /path/to/aria-bot
chmod 644 /path/to/aria-bot/config.json
```

## 🎵 Testing

### Test Bot Functionality
1. Invite bot to Discord server
2. Join a voice channel
3. Use `/play` command with a YouTube URL
4. Test other commands like `/pause`, `/skip`, `/queue`

### Test Audio Quality
```bash
# Test audio output
speaker-test -t wav -c 2

# Test with music
./start-pi.sh
# Then test in Discord
```

## 📈 Performance Tuning

### For Pi 4 (4GB)
```json
{
    "settings": {
        "maxQueueSize": 25,
        "defaultVolume": 30
    },
    "pi": {
        "maxMemoryUsage": "256MB"
    }
}
```

### For Pi 5 (8GB)
```json
{
    "settings": {
        "maxQueueSize": 75,
        "defaultVolume": 50
    },
    "pi": {
        "maxMemoryUsage": "1GB"
    }
}
```

## 🆘 Support

### Getting Help
1. Check the [troubleshooting guide](PI_TROUBLESHOOTING.md)
2. Check bot logs: `./logs-aria.sh`
3. Check system logs: `sudo journalctl -u aria-bot`
4. Create an issue on GitHub

### Useful Commands
```bash
# Quick health check
./monitor-pi.sh

# Restart everything
sudo systemctl restart aria-bot

# Reset to defaults
cp config.pi.json config.json

# Reinstall dependencies
rm -rf node_modules && npm install
```

---

**🎉 Congratulations! Your Aria Bot is now running on Raspberry Pi 5!**

The bot will automatically start on boot and restart if it crashes. You can manage it using the provided scripts or systemd commands.
