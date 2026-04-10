# 🍓 Aria Bot - Raspberry Pi Troubleshooting Guide

This guide helps you resolve common issues when running Aria Bot on Raspberry Pi 5.

## 📋 Quick Diagnostics

### Check Bot Status
```bash
# Check if bot is running
./status-aria.sh

# Check systemd service status
sudo systemctl status aria-bot

# View recent logs
sudo journalctl -u aria-bot -n 50
```

### System Resource Check
```bash
# Check memory usage
free -h

# Check CPU usage
top -p $(pgrep -f "node.*src/index.js")

# Check disk space
df -h

# Check temperature
vcgencmd measure_temp
```

## 🔧 Common Issues & Solutions

### 1. Bot Won't Start

#### Issue: "Cannot find module" errors
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18.x or higher
```

#### Issue: "Permission denied" errors
**Solution:**
```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/aria-bot

# Fix permissions
chmod +x scripts/*.sh
chmod +x start-pi.sh monitor-pi.sh
```

#### Issue: "Port already in use" error
**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in config.json
```

### 2. Audio Issues

#### Issue: No sound output
**Solution:**
```bash
# Check audio devices
aplay -l

# Test audio
speaker-test -t wav -c 2

# Run audio optimization
./scripts/optimize-audio.sh

# Check ALSA configuration
cat /etc/asound.conf
```

#### Issue: Audio crackling or distortion
**Solution:**
```bash
# Increase audio buffer size
echo "pcm.!default {
    type hw
    card 0
    period_size 1024
    buffer_size 4096
}" | sudo tee /etc/asound.conf

# Restart audio service
sudo systemctl restart alsa-state
```

#### Issue: "Audio device not found" error
**Solution:**
```bash
# Install audio packages
sudo apt install -y alsa-utils pulseaudio

# Add user to audio group
sudo usermod -a -G audio $USER

# Reboot after adding to group
sudo reboot
```

### 3. Performance Issues

#### Issue: High memory usage
**Solution:**
```bash
# Use Pi-optimized start script
./start-pi.sh

# Monitor memory usage
./monitor-pi.sh

# Reduce queue size in config.json
# Set maxQueueSize to 25-50
```

#### Issue: High CPU usage
**Solution:**
```bash
# Check CPU temperature
vcgencmd measure_temp

# If temperature > 70°C, add cooling
# Reduce audio quality in config
# Set defaultVolume to 30-40
```

#### Issue: Bot crashes frequently
**Solution:**
```bash
# Check system logs
sudo journalctl -u aria-bot -f

# Enable auto-restart in systemd
sudo systemctl edit aria-bot

# Add:
[Service]
Restart=always
RestartSec=10
```

### 4. Network Issues

#### Issue: "ECONNREFUSED" or connection errors
**Solution:**
```bash
# Check internet connection
ping google.com

# Check DNS resolution
nslookup discord.com

# Restart network service
sudo systemctl restart networking
```

#### Issue: Bot can't connect to Discord
**Solution:**
```bash
# Verify bot token
node -e "console.log(require('./config.json').token)"

# Check firewall
sudo ufw status

# Test Discord API
curl -H "Authorization: Bot YOUR_TOKEN" https://discord.com/api/v10/gateway
```

### 5. System Service Issues

#### Issue: Bot doesn't start on boot
**Solution:**
```bash
# Enable service
sudo systemctl enable aria-bot

# Check if enabled
systemctl is-enabled aria-bot

# Check service file
sudo systemctl cat aria-bot
```

#### Issue: Service fails to start
**Solution:**
```bash
# Check service logs
sudo journalctl -u aria-bot -f

# Test manual start
sudo systemctl start aria-bot

# Check service file syntax
sudo systemctl daemon-reload
```

## 🔍 Advanced Diagnostics

### Memory Analysis
```bash
# Detailed memory usage
cat /proc/meminfo

# Process memory map
pmap $(pgrep -f "node.*src/index.js")

# Memory leaks detection
node --inspect src/index.js
```

### Audio Debugging
```bash
# ALSA debug info
aplay -vvv /dev/urandom

# PulseAudio debug
pulseaudio --log-level=debug

# Check audio permissions
ls -la /dev/snd/
```

### Network Debugging
```bash
# Network connections
netstat -tulpn | grep node

# Discord API test
curl -v https://discord.com/api/v10/gateway

# Check proxy settings
echo $HTTP_PROXY $HTTPS_PROXY
```

## 🛠️ Performance Optimization

### Memory Optimization
```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Use Pi-optimized config
cp config.pi.json config.json

# Enable swap if needed
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### CPU Optimization
```bash
# Set CPU governor to performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable wifi-powersave
```

### Audio Optimization
```bash
# Run audio optimization
./scripts/optimize-audio.sh

# Set real-time priority
echo "@audio   -  rtprio     95" | sudo tee -a /etc/security/limits.conf
echo "@audio   -  memlock    unlimited" | sudo tee -a /etc/security/limits.conf
```

## 📊 Monitoring & Maintenance

### Regular Health Checks
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🏥 Aria Bot Health Check"
echo "========================"

# Check if running
if pgrep -f "node.*src/index.js" > /dev/null; then
    echo "✅ Bot is running"
else
    echo "❌ Bot is not running"
    exit 1
fi

# Check memory
MEMORY=$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
echo "💾 Memory usage: $MEMORY"

# Check temperature
TEMP=$(vcgencmd measure_temp | cut -d= -f2)
echo "🌡️  Temperature: $TEMP"

# Check disk space
DISK=$(df -h . | awk 'NR==2 {print $5}')
echo "💿 Disk usage: $DISK"
EOF

chmod +x health-check.sh
```

### Log Rotation
```bash
# Check log rotation
sudo logrotate -d /etc/logrotate.d/aria-bot

# Manual log cleanup
find logs/ -name "*.log" -mtime +7 -delete
```

## 🆘 Emergency Recovery

### Complete Reset
```bash
# Stop bot
sudo systemctl stop aria-bot

# Backup config
cp config.json config.json.backup

# Clean install
rm -rf node_modules package-lock.json
npm install

# Restore config
cp config.json.backup config.json

# Restart
sudo systemctl start aria-bot
```

### System Recovery
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Reinstall audio packages
sudo apt install --reinstall alsa-utils pulseaudio

# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install --reinstall nodejs

# Reinstall bot dependencies
npm install
```

## 📞 Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Run `./monitor-pi.sh` and share output
3. Check logs with `sudo journalctl -u aria-bot -n 100`
4. Verify your Pi model and OS version

### Useful Information to Include
- Raspberry Pi model (Pi 4, Pi 5, etc.)
- OS version (`cat /etc/os-release`)
- Node.js version (`node --version`)
- Available memory (`free -h`)
- Error messages from logs

### Community Support
- GitHub Issues: [Create an issue](https://github.com/yourusername/aria-bot/issues)
- Discord Server: [Join our community](https://discord.gg/your-server)

---

**Remember:** Most issues can be resolved by restarting the bot or checking the logs. Always check the system resources first!
