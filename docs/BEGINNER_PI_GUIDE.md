# 🍓 Complete Beginner's Guide: Aria Bot on Raspberry Pi 5

This guide is designed for complete beginners with no Raspberry Pi experience. We'll walk through everything step by step!

## 📋 What You'll Need

### Hardware
- **Raspberry Pi 5** (4GB or 8GB RAM recommended)
- **MicroSD Card** (32GB or larger, Class 10 or better)
- **Power Supply** (USB-C, 5V/3A for Pi 5)
- **Ethernet Cable** (for internet connection)
- **MicroSD Card Reader** (for your computer)
- **Monitor/TV** with HDMI port
- **USB Keyboard and Mouse**
- **Heatsink and Fan** (recommended for Pi 5)

### Software
- **Raspberry Pi Imager** (free software)
- **Discord Account** (for bot token)
- **Computer** (Windows, Mac, or Linux)

## 🚀 Step 1: Prepare Your Raspberry Pi

### 1.1 Download Raspberry Pi Imager
1. Go to [rpi.org/downloads](https://www.raspberrypi.org/downloads/)
2. Download "Raspberry Pi Imager" for your computer
3. Install it on your computer

### 1.2 Download Raspberry Pi OS
1. Open Raspberry Pi Imager
2. Click "Choose OS"
3. Select "Raspberry Pi OS (64-bit)" - this is the recommended version
4. Click "Choose Storage" and select your microSD card
5. Click the gear icon (⚙️) to open advanced options
6. **IMPORTANT**: Enable SSH and set a password (you'll need this later)
7. Click "Write" and wait for it to finish

### 1.3 Insert SD Card and Boot
1. Insert the microSD card into your Raspberry Pi
2. Connect your monitor, keyboard, and mouse
3. Connect the ethernet cable to your router
4. Connect the power supply to turn on the Pi
5. Wait for it to boot up (first boot takes a few minutes)

## 🔧 Step 2: Initial Pi Setup

### 2.1 First Boot Setup
When your Pi boots for the first time, you'll see a setup wizard:

1. **Country/Language**: Select your country and language
2. **Password**: Set a password for the 'pi' user (remember this!)
3. **WiFi**: Connect to your WiFi network (optional if using ethernet)
4. **Update Software**: Click "Next" to update the system
5. **Restart**: Click "Restart" when prompted

### 2.2 Enable SSH (for remote access)
1. Open Terminal (click the terminal icon in the top menu)
2. Type: `sudo raspi-config`
3. Navigate to "Interfacing Options" → "SSH"
4. Select "Yes" to enable SSH
5. Press Enter, then select "Finish"
6. Type `sudo reboot` to restart

### 2.3 Find Your Pi's IP Address
1. Open Terminal
2. Type: `hostname -I`
3. Write down the IP address (e.g., 192.168.1.100)

## 💻 Step 3: Connect from Your Computer (Optional but Recommended)

### 3.1 Windows Users
1. Download **PuTTY** from [putty.org](https://www.putty.org/)
2. Open PuTTY
3. Enter your Pi's IP address
4. Port: 22, Connection type: SSH
5. Click "Open"
6. Login: `pi`, Password: (the password you set)

### 3.2 Mac/Linux Users
1. Open Terminal
2. Type: `ssh pi@YOUR_PI_IP_ADDRESS`
3. Enter the password when prompted

## 🤖 Step 4: Create Your Discord Bot

### 4.1 Go to Discord Developer Portal
1. Open [discord.com/developers/applications](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click "New Application"
4. Name it "Aria Bot" (or whatever you want)
5. Click "Create"

### 4.2 Create the Bot
1. In your application, click "Bot" in the left sidebar
2. Click "Add Bot"
3. Click "Yes, do it!"
4. **IMPORTANT**: Copy the bot token (click "Copy") - you'll need this later!
5. Under "Privileged Gateway Intents", enable:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 4.3 Set Bot Permissions
1. Click "OAuth2" → "URL Generator" in the left sidebar
2. Under "Scopes", check:
   - ✅ bot
   - ✅ applications.commands
3. Under "Bot Permissions", check:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
4. Copy the generated URL at the bottom

### 4.4 Invite Bot to Your Server
1. Open the copied URL in a new browser tab
2. Select your Discord server
3. Click "Authorize"
4. Complete the captcha if prompted
5. Your bot should now appear in your server (offline)

## 🎵 Step 5: Install Aria Bot on Your Pi

### 5.1 Connect to Your Pi
Open Terminal (or PuTTY) and connect to your Pi:
```bash
ssh pi@YOUR_PI_IP_ADDRESS
```

### 5.2 Download Aria Bot
```bash
# Download the bot
git clone https://github.com/yourusername/aria-bot.git
cd aria-bot

# Make the setup script executable
chmod +x scripts/pi-setup.sh
```

### 5.3 Run the Automated Setup
```bash
# This will install everything automatically
./scripts/pi-setup.sh
```

**This script will:**
- Update your Pi's software
- Install Node.js and all dependencies
- Install audio software
- Create the bot service
- Set up monitoring

**Just follow the prompts and wait for it to finish!**

## ⚙️ Step 6: Configure Your Bot

### 6.1 Run the Configuration Wizard
```bash
npm run setup
```

### 6.2 Enter Your Bot Details
The wizard will ask for:

1. **Discord Bot Token**: Paste the token you copied earlier
2. **Discord Application ID**: 
   - Go back to Discord Developer Portal
   - Click "General Information"
   - Copy the "Application ID"
3. **Your Discord User ID**:
   - In Discord, go to User Settings → Advanced
   - Enable "Developer Mode"
   - Right-click your username and select "Copy ID"
4. **Spotify Integration** (optional):
   - You can skip this for now
   - You can add it later if you want

### 6.3 Test Your Configuration
```bash
# Start the bot
./start-aria.sh

# Check if it's working
./status-aria.sh
```

## 🎉 Step 7: Test Your Bot!

### 7.1 Check Discord
1. Go to your Discord server
2. Your bot should now show as "Online" (green dot)
3. Try typing `/` in a text channel - you should see bot commands!

### 7.2 Test Music Commands
1. Join a voice channel
2. Type `/play` and search for a song
3. The bot should join and start playing music!

### 7.3 If Something Goes Wrong
```bash
# Check what's happening
./logs-aria.sh

# Restart the bot
./restart-aria.sh

# Check system status
./monitor-pi.sh
```

## 🔄 Step 8: Set Up Auto-Start (Optional)

Your bot is already set up to start automatically when your Pi boots up! But you can control this:

```bash
# Check if auto-start is enabled
systemctl is-enabled aria-bot

# If you want to disable auto-start
sudo systemctl disable aria-bot

# If you want to enable auto-start
sudo systemctl enable aria-bot
```

## 🛠️ Step 9: Basic Management

### 9.1 Daily Commands
```bash
# Start the bot
./start-aria.sh

# Stop the bot
./stop-aria.sh

# Restart the bot
./restart-aria.sh

# Check if it's running
./status-aria.sh

# View recent activity
./logs-aria.sh
```

### 9.2 Monitor Performance
```bash
# Check system performance
./monitor-pi.sh

# Check temperature
vcgencmd measure_temp

# Check memory usage
free -h
```

## 🚨 Troubleshooting Common Issues

### Bot Won't Start
```bash
# Check the logs
./logs-aria.sh

# Try starting manually
node src/index.js
```

### No Sound
```bash
# Test audio
speaker-test -t wav -c 2

# If no sound, check audio settings
sudo raspi-config
# Go to Advanced Options → Audio → Force 3.5mm jack
```

### Bot Goes Offline
```bash
# Check internet connection
ping google.com

# Restart the bot
./restart-aria.sh
```

### High Temperature
```bash
# Check temperature
vcgencmd measure_temp

# If over 70°C, add cooling or reduce load
```

## 📱 Step 10: Remote Management (Advanced)

### 10.1 Access from Your Phone
1. Download "Termius" or "SSH Client" app
2. Connect using your Pi's IP address
3. Login with `pi` and your password
4. Run management commands remotely!

### 10.2 Web Interface (Optional)
If you enabled the admin panel:
1. Open browser on your computer
2. Go to `http://YOUR_PI_IP_ADDRESS:3000`
3. Use the web interface to manage your bot

## 🎯 What's Next?

### Customize Your Bot
- Edit `config.json` to change settings
- Add custom commands
- Set up Spotify integration
- Configure auto-disconnect settings

### Monitor Your Bot
- Check logs regularly: `./logs-aria.sh`
- Monitor performance: `./monitor-pi.sh`
- Keep your Pi updated: `sudo apt update && sudo apt upgrade`

### Join the Community
- Get help on Discord servers
- Share your setup
- Learn about advanced features

## 🆘 Need Help?

### Quick Fixes
```bash
# Restart everything
sudo reboot

# Reset bot configuration
cp config.pi.json config.json

# Reinstall everything
rm -rf node_modules && npm install
```

### Getting Support
1. Check the logs first: `./logs-aria.sh`
2. Try the troubleshooting guide
3. Ask for help in Discord communities
4. Create an issue on GitHub

---

## 🎉 Congratulations!

You now have a fully functional Discord music bot running on your Raspberry Pi 5! 

**Your bot will:**
- ✅ Start automatically when your Pi boots
- ✅ Play music from YouTube and Spotify
- ✅ Respond to slash commands
- ✅ Manage music queues
- ✅ Auto-disconnect when not in use
- ✅ Run 24/7 without issues

**Remember:**
- Keep your Pi plugged in and connected to internet
- Check on it occasionally with `./monitor-pi.sh`
- Update it regularly with `sudo apt update && sudo apt upgrade`

Enjoy your new music bot! 🎵
