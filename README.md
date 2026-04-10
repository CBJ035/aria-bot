# 🎵 Aria Bot - Modern Discord Music Bot

A powerful, feature-rich Discord music bot with YouTube and Spotify integration, built with the latest technologies and optimized for local hosting and Raspberry Pi deployment.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.17.0-brightgreen.svg)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎶 Music Playback
- **High-Quality Audio** - Crystal clear music streaming
- **YouTube Support** - Play any YouTube video or playlist
- **Spotify Integration** - Search and play Spotify tracks, albums, and playlists
- **Queue Management** - Advanced queue system with shuffle, loop, and more
- **Multiple Sources** - Support for various audio sources through discord-player

### 🎛️ Control & Management
- **Slash Commands** - Modern Discord slash command interface
- **Rich Embeds** - Beautiful, interactive responses
- **Volume Control** - Adjust playback volume (0-100%)
- **Loop Modes** - Off, Track, Queue loop options
- **Auto-disconnect** - Smart voice channel management

### 🖥️ Administration
- **Modern Admin Panel** - Beautiful terminal-based control interface
- **Real-time Monitoring** - Bot status, uptime, and performance metrics
- **Log Management** - Comprehensive logging system
- **Easy Configuration** - Interactive setup wizard

### 🔧 Technical Features
- **discord-player v6** - Latest music framework
- **Modern Architecture** - ES6 modules, clean code structure
- **Local Hosting** - No external dependencies or hosting required
- **Raspberry Pi Ready** - Optimized for low-resource environments
- **Error Handling** - Robust error management and recovery

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.17.0 or higher
- **FFmpeg** (automatically handled by ffmpeg-static)
- **Discord Bot Token** ([Get one here](https://discord.com/developers/applications))
- **Spotify API Keys** (Optional, [Get them here](https://developer.spotify.com/dashboard))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aria-bot.git
   cd aria-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the setup wizard**
   ```bash
   npm run setup
   ```

4. **Start the bot**
   ```bash
   npm start
   # or use the admin panel
   npm run admin
   ```

## 🎯 Commands

### 🎵 Music Commands
- `/play <query>` - Play a song or add to queue
- `/pause` - Pause/resume playback
- `/skip` - Skip current song
- `/stop` - Stop music and clear queue
- `/queue [page]` - Show current queue
- `/nowplaying [detailed]` - Show current track info
- `/volume <level>` - Adjust volume (0-100)
- `/loop [mode]` - Toggle loop modes (off/track/queue)
- `/shuffle` - Shuffle the queue
- `/clear` - Clear the queue

### 🎵 Spotify Commands
- `/spotify search <query>` - Search Spotify tracks
- `/spotify play <url>` - Play Spotify track/album/playlist

### ℹ️ Utility Commands
- `/help` - Show all commands

## 🖥️ Admin Panel

The admin panel provides a beautiful terminal interface for managing your bot:

```bash
npm run admin
```

### Features:
- **Real-time Status** - Bot online status, uptime, memory usage
- **Process Management** - Start, stop, restart the bot
- **Log Viewing** - Real-time log monitoring
- **Configuration** - View and manage bot settings
- **Dependency Management** - Install/update dependencies
- **System Information** - Hardware and software details

## ⚙️ Configuration

The bot uses `config.json` for configuration. Run `npm run setup` for an interactive configuration wizard, or edit manually:

```json
{
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "clientId": "YOUR_DISCORD_APPLICATION_ID",
    "ownerId": "YOUR_DISCORD_USER_ID",
    "spotify": {
        "clientId": "YOUR_SPOTIFY_CLIENT_ID",
        "clientSecret": "YOUR_SPOTIFY_CLIENT_SECRET"
    },
    "settings": {
        "defaultVolume": 50,
        "maxQueueSize": 100,
        "leaveOnEmpty": true,
        "leaveOnEnd": true
    }
}
```

## 🍓 Raspberry Pi 5 Deployment

Aria Bot is fully optimized for Raspberry Pi 5 with automated setup and Pi-specific optimizations!

### 🚀 Quick Start (Recommended)

**One-command installation:**
```bash
# Clone the repository
git clone https://github.com/yourusername/aria-bot.git
cd aria-bot

# Run the automated Pi setup script
chmod +x scripts/pi-setup.sh
./scripts/pi-setup.sh
```

The setup script will automatically:
- ✅ Update your Raspberry Pi OS
- ✅ Install Node.js 18.x and all dependencies
- ✅ Install FFmpeg and audio packages
- ✅ Create systemd service for auto-start
- ✅ Apply Pi-specific optimizations
- ✅ Set up log rotation and monitoring
- ✅ Create management scripts

### 📋 System Requirements

#### Minimum Requirements
- **Raspberry Pi 4B** (4GB RAM) or **Raspberry Pi 5** (4GB RAM)
- **Raspberry Pi OS** 64-bit (Bullseye or newer)
- **32GB SD Card** (Class 10 or better)
- **Stable internet connection**

#### Recommended Setup
- **Raspberry Pi 5** (8GB RAM) for best performance
- **64GB+ SD Card** (Class 10 or better)
- **Active cooling** (heatsink + fan)
- **Ethernet connection** (more stable than WiFi)

### 🛠️ Manual Installation

If you prefer manual setup:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install essential packages
sudo apt install -y curl wget git build-essential python3 python3-pip

# 3. Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install FFmpeg and audio dependencies
sudo apt install -y ffmpeg alsa-utils pulseaudio libasound2-dev libpulse-dev

# 5. Clone and setup bot
git clone https://github.com/yourusername/aria-bot.git
cd aria-bot
npm install

# 6. Run Pi optimizations
node scripts/pi-optimize.js

# 7. Configure bot
npm run setup

# 8. Start bot
npm start
```

### ⚡ Pi-Specific Optimizations

Aria Bot includes several optimizations for Raspberry Pi:

#### Memory Management
- **Reduced queue size** (50 songs max vs 100)
- **Lower default volume** (40% vs 50%)
- **Memory limits** (512MB max usage)
- **Garbage collection optimization**

#### Audio Optimizations
- **Optimized buffer sizes** for Pi hardware
- **Low-latency audio processing**
- **ALSA configuration** for better performance
- **Real-time audio priority**

#### System Integration
- **systemd service** for auto-start
- **Log rotation** to prevent disk full
- **Resource monitoring** scripts
- **Temperature monitoring**

### 🎛️ Management Commands

After installation, use these convenient scripts:

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

# Pi-optimized start
./start-pi.sh
```

### 🔧 Configuration

#### Pi-Optimized Settings
The bot automatically uses Pi-optimized settings:

```json
{
    "settings": {
        "maxQueueSize": 50,        // Reduced for Pi
        "defaultVolume": 40,       // Lower volume
        "autoDisconnectTimeout": 300000
    },
    "pi": {
        "optimized": true,
        "maxMemoryUsage": "512MB",
        "cpuThrottle": true,
        "audioBufferSize": 1024,
        "lowLatencyMode": true
    }
}
```

#### Performance Tuning
For different Pi models:

**Pi 4 (4GB):**
```bash
# Use standard settings
cp config.pi.json config.json
```

**Pi 5 (8GB):**
```bash
# Increase limits in config.json
"maxQueueSize": 75,
"pi": {
    "maxMemoryUsage": "1GB"
}
```

### 🚨 Troubleshooting

#### Common Issues
1. **Bot won't start**: Check logs with `./logs-aria.sh`
2. **No audio**: Run `./scripts/optimize-audio.sh`
3. **High memory usage**: Use `./start-pi.sh`
4. **Crashes frequently**: Check temperature with `./monitor-pi.sh`

#### Quick Fixes
```bash
# Restart everything
sudo systemctl restart aria-bot

# Check system resources
./monitor-pi.sh

# Reinstall dependencies
rm -rf node_modules && npm install

# Reset to Pi defaults
cp config.pi.json config.json
```

#### Detailed Troubleshooting
See our comprehensive [Pi Troubleshooting Guide](docs/PI_TROUBLESHOOTING.md) for detailed solutions.

### 📊 Performance Monitoring

#### Real-time Monitoring
```bash
# Monitor bot performance
./monitor-pi.sh

# Check system temperature
vcgencmd measure_temp

# Monitor memory usage
watch -n 1 'free -h'
```

#### Log Analysis
```bash
# View recent logs
sudo journalctl -u aria-bot -f

# Check for errors
sudo journalctl -u aria-bot | grep -i error

# View bot logs
tail -f logs/bot.log
```

### 🔄 Auto-Start on Boot

The setup script automatically configures the bot to start on boot:

```bash
# Check if enabled
systemctl is-enabled aria-bot

# Manually enable/disable
sudo systemctl enable aria-bot    # Enable
sudo systemctl disable aria-bot   # Disable

# Start/stop service
sudo systemctl start aria-bot     # Start
sudo systemctl stop aria-bot      # Stop
```

### 🌡️ Temperature Management

#### Monitor Temperature
```bash
# Check current temperature
vcgencmd measure_temp

# Monitor continuously
watch -n 5 vcgencmd measure_temp
```

#### Cooling Recommendations
- **Pi 4**: Heatsink recommended
- **Pi 5**: Heatsink + fan recommended
- **Overclocking**: Not recommended for 24/7 operation

### 💾 Storage Management

#### Log Rotation
Logs are automatically rotated to prevent disk full:
- **Daily rotation** of log files
- **7 days retention** by default
- **Compression** of old logs

#### Disk Usage
```bash
# Check disk usage
df -h

# Check log sizes
du -sh logs/

# Clean old logs
find logs/ -name "*.log" -mtime +7 -delete
```

### 🔒 Security Considerations

#### Firewall Setup
```bash
# Check firewall status
sudo ufw status

# Allow admin panel (if enabled)
sudo ufw allow 3000/tcp
```

#### User Permissions
The bot runs as a regular user (not root) for security:
- **No sudo required** for normal operation
- **Limited system access**
- **Secure file permissions**

### 🎵 Audio Quality Tips

#### Best Audio Settings
1. **Use Ethernet** instead of WiFi
2. **Close unnecessary applications**
3. **Set volume to 40-60%** maximum
4. **Use high-quality audio files**

#### Audio Troubleshooting
```bash
# Test audio output
speaker-test -t wav -c 2

# Check audio devices
aplay -l

# Optimize audio
./scripts/optimize-audio.sh
```

### 📈 Performance Tips

#### For Better Performance
1. **Use Pi 5** with 8GB RAM
2. **Enable GPU memory split**: `sudo raspi-config`
3. **Use fast SD card** (Class 10+)
4. **Keep system updated**
5. **Monitor temperature**

#### Resource Optimization
```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable wifi-powersave

# Set CPU governor to performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

---

**🎉 Your Aria Bot is now ready for Raspberry Pi 5!** The automated setup ensures optimal performance and reliability for your music bot.

## 🛠️ Development

### Project Structure
```
aria-bot/
├── src/
│   ├── commands/          # Slash commands
│   ├── events/            # Discord.js events
│   ├── services/          # Business logic services
│   └── index.js           # Main bot file
├── admin/
│   └── panel.js           # Admin panel interface
├── scripts/               # Utility scripts
├── config.json            # Bot configuration
└── package.json
```

### Adding Commands
1. Create a new file in `src/commands/`
2. Export an object with `data` (SlashCommandBuilder) and `execute` function
3. The command will be automatically loaded

### Environment Variables
- `NODE_ENV` - Set to 'production' for production mode
- `BOT_TOKEN` - Override config.json token
- `LOG_LEVEL` - Set logging level (error, warn, info, debug)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **discord.js** - Powerful Discord API library
- **discord-player** - Comprehensive music framework
- **Spotify Web API** - Music metadata and search
- **FFmpeg** - Audio processing
- All the amazing open-source contributors

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/yourusername/aria-bot/issues)
- **Discussions** - [GitHub Discussions](https://github.com/yourusername/aria-bot/discussions)
- **Discord** - [Support Server](https://discord.gg/your-server)

---

<div align="center">
  <strong>🎵 Made with ❤️ for the Discord community</strong>
  <br>
  <sub>Give it a ⭐ if you found it helpful!</sub>
</div></div>
