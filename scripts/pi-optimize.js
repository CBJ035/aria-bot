#!/usr/bin/env node

/**
 * Raspberry Pi Optimization Script for Aria Bot
 * This script applies Pi-specific optimizations to improve performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DIR = path.join(__dirname, '..');

console.log(chalk.cyan('🍓 Aria Bot - Raspberry Pi Optimization'));
console.log(chalk.blue('⚡ Applying Pi-specific performance optimizations...'));
console.log('');

class PiOptimizer {
    constructor() {
        this.configPath = path.join(BOT_DIR, 'config.json');
        this.piConfigPath = path.join(BOT_DIR, 'config.pi.json');
    }

    async optimize() {
        try {
            await this.checkPiEnvironment();
            await this.optimizeSystemSettings();
            await this.optimizeNodeSettings();
            await this.optimizeBotConfig();
            await this.setupAudioOptimizations();
            await this.createPiScripts();
            
            console.log(chalk.green('✅ Raspberry Pi optimizations applied successfully!'));
            console.log(chalk.blue('🎵 Your bot is now optimized for Pi performance'));
        } catch (error) {
            console.error(chalk.red('❌ Optimization failed:'), error.message);
            process.exit(1);
        }
    }

    async checkPiEnvironment() {
        console.log(chalk.blue('🔍 Checking Raspberry Pi environment...'));
        
        // Check if running on Pi
        try {
            const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
            if (!cpuInfo.includes('Raspberry Pi')) {
                console.log(chalk.yellow('⚠️  Warning: Not running on Raspberry Pi'));
            } else {
                console.log(chalk.green('✅ Raspberry Pi detected'));
            }
        } catch (error) {
            console.log(chalk.yellow('⚠️  Could not detect Pi environment'));
        }

        // Check available memory
        try {
            const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
            const memTotal = memInfo.match(/MemTotal:\s+(\d+)/);
            if (memTotal) {
                const totalMB = Math.round(parseInt(memTotal[1]) / 1024);
                console.log(chalk.blue(`📊 Total RAM: ${totalMB}MB`));
                
                if (totalMB < 2048) {
                    console.log(chalk.yellow('⚠️  Low memory detected - applying aggressive optimizations'));
                }
            }
        } catch (error) {
            console.log(chalk.yellow('⚠️  Could not read memory info'));
        }
    }

    async optimizeSystemSettings() {
        console.log(chalk.blue('⚙️  Optimizing system settings...'));
        
        try {
            // Set CPU governor to performance
            execSync('echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor', { stdio: 'pipe' });
            console.log(chalk.green('✅ CPU governor set to performance'));
        } catch (error) {
            console.log(chalk.yellow('⚠️  Could not set CPU governor'));
        }

        try {
            // Increase audio buffer size
            execSync('echo "pcm.!default { type hw card 0 }" | sudo tee /etc/asound.conf', { stdio: 'pipe' });
            console.log(chalk.green('✅ Audio configuration optimized'));
        } catch (error) {
            console.log(chalk.yellow('⚠️  Could not optimize audio settings'));
        }
    }

    async optimizeNodeSettings() {
        console.log(chalk.blue('🔧 Optimizing Node.js settings...'));
        
        // Create .nvmrc for Node version
        const nodeVersion = process.version;
        fs.writeFileSync(path.join(BOT_DIR, '.nvmrc'), nodeVersion);
        console.log(chalk.green(`✅ Node version ${nodeVersion} recorded`));

        // Create optimized package.json script
        const packageJsonPath = path.join(BOT_DIR, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        packageJson.scripts = {
            ...packageJson.scripts,
            'start:pi': 'NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" node src/index.js',
            'start:pi-bg': 'NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" node scripts/daemon.js'
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(chalk.green('✅ Pi-optimized scripts added'));
    }

    async optimizeBotConfig() {
        console.log(chalk.blue('🎵 Optimizing bot configuration...'));
        
        let config;
        try {
            config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } catch (error) {
            console.log(chalk.yellow('⚠️  No existing config found, using Pi template'));
            config = JSON.parse(fs.readFileSync(this.piConfigPath, 'utf8'));
        }

        // Apply Pi optimizations
        config.settings = {
            ...config.settings,
            maxQueueSize: 50,  // Reduced for Pi
            defaultVolume: 40,  // Lower default volume
            autoDisconnectTimeout: 300000
        };

        // Add Pi-specific settings
        config.pi = {
            optimized: true,
            maxMemoryUsage: '512MB',
            cpuThrottle: true,
            audioBufferSize: 1024,
            lowLatencyMode: true,
            enableGpuAcceleration: false
        };

        // Backup original config
        if (fs.existsSync(this.configPath)) {
            fs.copyFileSync(this.configPath, this.configPath + '.backup');
        }

        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 4));
        console.log(chalk.green('✅ Bot configuration optimized for Pi'));
    }

    async setupAudioOptimizations() {
        console.log(chalk.blue('🎧 Setting up audio optimizations...'));
        
        // Create audio optimization script
        const audioScript = `#!/bin/bash
# Audio optimizations for Raspberry Pi
echo "🎧 Applying audio optimizations..."

# Set audio buffer size
echo "pcm.!default {
    type hw
    card 0
    device 0
    period_time 0
    period_size 1024
    buffer_time 0
    buffer_size 4096
}" | sudo tee /etc/asound.conf

# Optimize ALSA settings
echo "defaults.pcm.rate_converter \"speexrate_medium\"" | sudo tee -a /etc/asound.conf
echo "defaults.ctl.card 0" | sudo tee -a /etc/asound.conf

echo "✅ Audio optimizations applied"
`;

        fs.writeFileSync(path.join(BOT_DIR, 'scripts', 'optimize-audio.sh'), audioScript);
        execSync(`chmod +x ${path.join(BOT_DIR, 'scripts', 'optimize-audio.sh')}`);
        console.log(chalk.green('✅ Audio optimization script created'));
    }

    async createPiScripts() {
        console.log(chalk.blue('📝 Creating Pi-specific management scripts...'));
        
        // Create Pi-specific start script
        const piStartScript = `#!/bin/bash
# Aria Bot - Raspberry Pi Optimized Start Script

echo "🍓 Starting Aria Bot (Pi Optimized)..."

# Set Pi-specific environment variables
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"
export NODE_ENV=production
export LOG_LEVEL=info

# Start with Pi optimizations
node src/index.js
`;

        fs.writeFileSync(path.join(BOT_DIR, 'start-pi.sh'), piStartScript);
        execSync(`chmod +x ${path.join(BOT_DIR, 'start-pi.sh')}`);

        // Create performance monitoring script
        const monitorScript = `#!/bin/bash
# Aria Bot - Raspberry Pi Performance Monitor

echo "📊 Aria Bot Performance Monitor"
echo "================================"

# Check bot process
if pgrep -f "node.*src/index.js" > /dev/null; then
    echo "✅ Bot is running"
    
    # Get process info
    PID=$(pgrep -f "node.*src/index.js")
    echo "📋 Process ID: $PID"
    
    # Memory usage
    MEMORY=$(ps -p $PID -o rss= | awk '{print $1/1024 " MB"}')
    echo "💾 Memory usage: $MEMORY"
    
    # CPU usage
    CPU=$(ps -p $PID -o %cpu= | awk '{print $1 "%"}')
    echo "⚡ CPU usage: $CPU"
    
    # System temperature (if available)
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
        TEMP_C=$((TEMP/1000))
        echo "🌡️  CPU Temperature: ${TEMP_C}°C"
    fi
    
    # Disk usage
    DISK=$(df -h . | awk 'NR==2 {print $5}')
    echo "💿 Disk usage: $DISK"
    
else
    echo "❌ Bot is not running"
fi

echo ""
echo "🔧 System Resources:"
free -h
`;

        fs.writeFileSync(path.join(BOT_DIR, 'monitor-pi.sh'), monitorScript);
        execSync(`chmod +x ${path.join(BOT_DIR, 'monitor-pi.sh')}`);

        console.log(chalk.green('✅ Pi-specific scripts created'));
    }
}

// Run optimization
const optimizer = new PiOptimizer();
optimizer.optimize();
