#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DIR = path.join(__dirname, '..');
const PID_FILE = path.join(BOT_DIR, 'bot.pid');
const LOG_FILE = path.join(BOT_DIR, 'logs', 'bot.log');

// Ensure logs directory exists
const logsDir = path.join(BOT_DIR, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

class AriaAdminPanel {
    constructor() {
        this.botProcess = null;
        this.isRunning = false;
        this.startTime = null;
    }

    async init() {
        console.clear();
        this.showHeader();
        await this.checkBotStatus();
        this.showMainMenu();
    }

    showHeader() {
        console.log(chalk.cyan(figlet.textSync('ARIA ADMIN', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default'
        })));
        
        console.log(chalk.green('🎵 Discord Music Bot Control Panel v3.0.0'));
        console.log(chalk.blue('🚀 Modern Admin Interface'));
        console.log(chalk.yellow('⚡ Local Hosting Optimized'));
        console.log('');
    }

    async checkBotStatus() {
        try {
            if (fs.existsSync(PID_FILE)) {
                const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
                
                // Check if process is actually running
                try {
                    process.kill(pid, 0); // Signal 0 checks if process exists
                    this.isRunning = true;
                    
                    // Get start time
                    const stat = fs.statSync(PID_FILE);
                    this.startTime = stat.mtime;
                } catch (error) {
                    // Process doesn't exist, clean up PID file
                    fs.unlinkSync(PID_FILE);
                    this.isRunning = false;
                }
            } else {
                this.isRunning = false;
            }
        } catch (error) {
            this.isRunning = false;
        }
    }

    getUptime() {
        if (!this.startTime) return 'N/A';
        
        const now = new Date();
        const diff = now - this.startTime;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    showStatus() {
        const status = this.isRunning ? chalk.green('🟢 ONLINE') : chalk.red('🔴 OFFLINE');
        const uptime = this.getUptime();
        
        console.log(chalk.cyan('┌─ BOT STATUS ─────────────────────────────────────┐'));
        console.log(chalk.cyan('│') + ` 🤖 Status: ${status}`.padEnd(48) + chalk.cyan('│'));
        console.log(chalk.cyan('│') + ` ⏰ Uptime: ${chalk.white(uptime)}`.padEnd(58) + chalk.cyan('│'));
        console.log(chalk.cyan('│') + ` 📁 Directory: ${chalk.gray(BOT_DIR)}`.substring(0, 48).padEnd(48) + chalk.cyan('│'));
        console.log(chalk.cyan('└──────────────────────────────────────────────────┘'));
        console.log('');
    }

    async showMainMenu() {
        this.showStatus();
        
        const choices = [
            { name: '🚀 Start Bot (Background)', value: 'start', disabled: this.isRunning },
            { name: '⏹️  Stop Bot', value: 'stop', disabled: !this.isRunning },
            { name: '🔄 Restart Bot', value: 'restart', disabled: false },
            { name: '📊 View Logs', value: 'logs', disabled: false },
            { name: '📈 Bot Statistics', value: 'stats', disabled: !this.isRunning },
            { name: '⚙️  Configuration', value: 'config', disabled: false },
            { name: '🔧 Install Dependencies', value: 'install', disabled: false },
            { name: '🧪 Test Bot', value: 'test', disabled: false },
            new inquirer.Separator(),
            { name: '🔗 Install as Service', value: 'install-service', disabled: false },
            { name: '🗑️  Uninstall Service', value: 'uninstall-service', disabled: false },
            new inquirer.Separator(),
            { name: '❌ Exit', value: 'exit', disabled: false }
        ];

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select an action:',
                choices: choices,
                pageSize: 12
            }
        ]);

        await this.handleAction(action);
    }

    async handleAction(action) {
        switch (action) {
            case 'start':
                await this.startBot();
                break;
            case 'stop':
                await this.stopBot();
                break;
            case 'restart':
                await this.restartBot();
                break;
            case 'logs':
                await this.showLogs();
                break;
            case 'stats':
                await this.showStats();
                break;
            case 'config':
                await this.showConfig();
                break;
            case 'install':
                await this.installDependencies();
                break;
            case 'test':
                await this.testBot();
                break;
            case 'install-service':
                await this.installService();
                break;
            case 'uninstall-service':
                await this.uninstallService();
                break;
            case 'exit':
                console.log(chalk.green('👋 Goodbye!'));
                process.exit(0);
                break;
            default:
                console.log(chalk.red('❌ Unknown action'));
        }
        
        console.log('');
        console.log(chalk.yellow('Press any key to continue...'));
        await new Promise(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
        
        await this.init();
    }

    async startBot() {
        if (this.isRunning) {
            console.log(chalk.yellow('⚠️  Bot is already running!'));
            return;
        }

        console.log(chalk.blue('🚀 Starting Aria Bot...'));
        
        try {
            const botProcess = spawn('node', ['scripts/daemon.js'], {
                cwd: BOT_DIR,
                detached: false,
                stdio: 'inherit'
            });

            // Wait a moment to check if it started successfully
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            await this.checkBotStatus();
            
            if (this.isRunning) {
                console.log(chalk.green('✅ Bot started successfully!'));
                console.log(chalk.cyan('ℹ️  Bot is running in the background'));
            } else {
                console.log(chalk.red('❌ Failed to start bot. Check logs for details.'));
            }
        } catch (error) {
            console.log(chalk.red('❌ Error starting bot:', error.message));
        }
    }

    async stopBot() {
        if (!this.isRunning) {
            console.log(chalk.yellow('⚠️  Bot is not running!'));
            return;
        }

        console.log(chalk.blue('⏹️  Stopping Aria Bot...'));
        
        try {
            const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
            process.kill(pid, 'SIGTERM');
            
            // Clean up PID file
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
            }
            
            this.isRunning = false;
            console.log(chalk.green('✅ Bot stopped successfully!'));
        } catch (error) {
            console.log(chalk.red('❌ Error stopping bot:', error.message));
        }
    }

    async restartBot() {
        console.log(chalk.blue('🔄 Restarting Aria Bot...'));
        
        if (this.isRunning) {
            await this.stopBot();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await this.startBot();
    }

    async showLogs() {
        console.clear();
        console.log(chalk.blue('📊 Real-time Bot Logs'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.yellow('Press Ctrl+C or X to exit log viewer'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log('');

        // Show recent logs first
        try {
            if (fs.existsSync(LOG_FILE)) {
                const logs = fs.readFileSync(LOG_FILE, 'utf8');
                const lines = logs.split('\n').slice(-10); // Last 10 lines
                
                lines.forEach(line => {
                    if (line.trim()) {
                        console.log(line); // Print raw line to preserve colors
                    }
                });
            }
        } catch (error) {
            console.log(chalk.red('❌ Error reading recent logs:', error.message));
        }

        console.log(chalk.cyan('\n🔄 Starting real-time log stream...\n'));

        // Set up real-time log monitoring
        const tailProcess = spawn('tail', ['-f', LOG_FILE], {
            cwd: BOT_DIR,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        // Handle log output
        tailProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    process.stdout.write(line + '\n');
                }
            });
        });

        // Handle errors
        tailProcess.stderr.on('data', (data) => {
            console.log(chalk.red('Log stream error:', data.toString()));
        });

        // Handle process exit
        tailProcess.on('close', (code) => {
            console.log(chalk.yellow('\n📊 Log stream ended'));
        });

        // Set up exit handlers
        const exitHandler = () => {
            console.log(chalk.yellow('\n📊 Exiting log viewer...'));
            tailProcess.kill();
            setTimeout(() => {
                console.log(chalk.green('✅ Log viewer closed'));
                this.showMainMenu();
            }, 1000);
        };

        // Listen for Ctrl+C
        process.on('SIGINT', exitHandler);
        
        // Listen for 'x' key press
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        process.stdin.on('data', (key) => {
            if (key === 'x' || key === 'X' || key === '\u0003') { // 'x' or Ctrl+C
                exitHandler();
            }
        });

        console.log(chalk.cyan('💡 Tip: Press X or Ctrl+C to exit'));
    }

    async showStats() {
        console.log(chalk.blue('📈 Bot Statistics:'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(chalk.cyan('Status:'), this.isRunning ? chalk.green('Online') : chalk.red('Offline'));
        console.log(chalk.cyan('Uptime:'), chalk.white(this.getUptime()));
        console.log(chalk.cyan('Process ID:'), chalk.white(fs.existsSync(PID_FILE) ? fs.readFileSync(PID_FILE, 'utf8').trim() : 'N/A'));
        console.log(chalk.cyan('Log File:'), chalk.gray(LOG_FILE));
        console.log(chalk.gray('─'.repeat(40)));
    }

    async showConfig() {
        console.log(chalk.blue('⚙️  Configuration:'));
        console.log(chalk.gray('─'.repeat(40)));
        
        try {
            const configPath = path.join(BOT_DIR, 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            console.log(chalk.cyan('Bot Token:'), chalk.gray('***' + config.token.slice(-4)));
            console.log(chalk.cyan('Client ID:'), chalk.white(config.clientId));
            console.log(chalk.cyan('Owner ID:'), chalk.white(config.ownerId));
            console.log(chalk.cyan('Default Volume:'), chalk.white(config.settings.defaultVolume + '%'));
            console.log(chalk.cyan('Max Queue Size:'), chalk.white(config.settings.maxQueueSize));
            console.log(chalk.cyan('Auto Disconnect:'), chalk.white(config.settings.autoDisconnectTimeout / 1000 + 's'));
        } catch (error) {
            console.log(chalk.red('❌ Error reading config:', error.message));
        }
        
        console.log(chalk.gray('─'.repeat(40)));
    }

    async installDependencies() {
        console.log(chalk.blue('🔧 Installing dependencies...'));
        
        return new Promise((resolve) => {
            const npmInstall = spawn('npm', ['install'], {
                cwd: BOT_DIR,
                stdio: 'inherit'
            });
            
            npmInstall.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green('✅ Dependencies installed successfully!'));
                } else {
                    console.log(chalk.red('❌ Failed to install dependencies.'));
                }
                resolve();
            });
        });
    }

    async testBot() {
        console.log(chalk.blue('🧪 Testing bot configuration...'));
        
        try {
            // Check if config exists and is valid
            const configPath = path.join(BOT_DIR, 'config.json');
            if (!fs.existsSync(configPath)) {
                console.log(chalk.red('❌ config.json not found!'));
                return;
            }
            
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            if (!config.token || config.token.length < 50) {
                console.log(chalk.red('❌ Invalid bot token in config.json'));
                return;
            }
            
            console.log(chalk.green('✅ Configuration file is valid'));
            console.log(chalk.green('✅ Bot token is present'));
            
            // Check if dependencies are installed
            const nodeModulesPath = path.join(BOT_DIR, 'node_modules');
            if (fs.existsSync(nodeModulesPath)) {
                console.log(chalk.green('✅ Dependencies are installed'));
            } else {
                console.log(chalk.yellow('⚠️  Dependencies not installed. Run install option first.'));
            }
            
            if (this.isRunning) {
                console.log(chalk.green('✅ Bot is currently running'));
            } else {
                console.log(chalk.yellow('⚠️  Bot is not running'));
            }
            
            console.log(chalk.blue('🎉 Test completed!'));
            
        } catch (error) {
            console.log(chalk.red('❌ Test failed:', error.message));
        }
    }

    async installService() {
        console.log(chalk.blue('🔗 Installing Aria Bot as macOS Launch Agent...'));
        
        return new Promise((resolve) => {
            const installProcess = spawn('node', ['scripts/install-service.js'], {
                cwd: BOT_DIR,
                stdio: 'inherit'
            });
            
            installProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green('✅ Service installed successfully!'));
                    console.log(chalk.cyan('🔄 The bot will now start automatically on login'));
                } else {
                    console.log(chalk.red('❌ Failed to install service.'));
                }
                resolve();
            });
        });
    }

    async uninstallService() {
        console.log(chalk.blue('🗑️  Uninstalling Aria Bot Launch Agent...'));
        
        return new Promise((resolve) => {
            const uninstallProcess = spawn('node', ['scripts/uninstall-service.js'], {
                cwd: BOT_DIR,
                stdio: 'inherit'
            });
            
            uninstallProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green('✅ Service uninstalled successfully!'));
                } else {
                    console.log(chalk.red('❌ Failed to uninstall service.'));
                }
                resolve();
            });
        });
    }
}

// Start the admin panel
const panel = new AriaAdminPanel();
panel.init().catch(console.error);
