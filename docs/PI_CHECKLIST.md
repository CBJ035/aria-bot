# ✅ Raspberry Pi 5 Setup Checklist

Use this checklist to make sure you don't miss any steps!

## 📦 Before You Start

- [ ] Raspberry Pi 5 (4GB or 8GB RAM)
- [ ] MicroSD card (32GB+, Class 10)
- [ ] Power supply (USB-C, 5V/3A)
- [ ] Ethernet cable
- [ ] Monitor/TV with HDMI
- [ ] USB keyboard and mouse
- [ ] Heatsink and fan (recommended)
- [ ] Computer with internet

## 🖥️ Computer Setup

- [ ] Download Raspberry Pi Imager
- [ ] Download Raspberry Pi OS (64-bit)
- [ ] Flash OS to microSD card
- [ ] Enable SSH in advanced options
- [ ] Set password for 'pi' user

## 🔌 Hardware Setup

- [ ] Insert microSD card into Pi
- [ ] Connect monitor via HDMI
- [ ] Connect keyboard and mouse
- [ ] Connect ethernet cable
- [ ] Connect power supply
- [ ] Wait for first boot

## ⚙️ Pi Initial Setup

- [ ] Complete first boot wizard
- [ ] Set country/language
- [ ] Set password for 'pi' user
- [ ] Connect to WiFi (optional)
- [ ] Update software
- [ ] Enable SSH via raspi-config
- [ ] Find Pi's IP address (`hostname -I`)
- [ ] Test SSH connection from computer

## 🤖 Discord Bot Setup

- [ ] Go to Discord Developer Portal
- [ ] Create new application
- [ ] Create bot in application
- [ ] Copy bot token
- [ ] Enable privileged intents
- [ ] Generate OAuth2 URL
- [ ] Invite bot to Discord server
- [ ] Verify bot appears in server

## 💻 Bot Installation

- [ ] SSH into Pi
- [ ] Clone Aria Bot repository
- [ ] Run automated setup script
- [ ] Wait for installation to complete
- [ ] Run configuration wizard
- [ ] Enter Discord bot token
- [ ] Enter Discord application ID
- [ ] Enter your Discord user ID
- [ ] Skip Spotify (optional)

## 🎵 Test Bot

- [ ] Start bot with `./start-aria.sh`
- [ ] Check status with `./status-aria.sh`
- [ ] Verify bot is online in Discord
- [ ] Join voice channel
- [ ] Test `/play` command
- [ ] Test other commands (`/pause`, `/skip`, `/queue`)

## 🔧 Final Setup

- [ ] Verify auto-start is enabled
- [ ] Test bot restart
- [ ] Check system performance
- [ ] Set up monitoring
- [ ] Configure any additional settings

## ✅ Success!

- [ ] Bot starts automatically on Pi boot
- [ ] Bot responds to commands in Discord
- [ ] Music plays correctly
- [ ] Bot auto-disconnects when idle
- [ ] System runs stable

## 🆘 If Something Goes Wrong

- [ ] Check logs: `./logs-aria.sh`
- [ ] Check status: `./status-aria.sh`
- [ ] Restart bot: `./restart-aria.sh`
- [ ] Check system: `./monitor-pi.sh`
- [ ] Check internet connection
- [ ] Verify Discord bot token
- [ ] Check audio output

## 📞 Getting Help

- [ ] Read troubleshooting guide
- [ ] Check GitHub issues
- [ ] Ask in Discord communities
- [ ] Verify all checklist items completed

---

**Remember:** Take your time with each step. It's better to do it right the first time than to troubleshoot later!
