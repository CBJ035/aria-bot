#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DIR = path.join(__dirname, '..');
const PID_FILE = path.join(BOT_DIR, 'bot.pid');
const LOG_DIR = path.join(BOT_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'bot.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function startBot() {
    console.log('🚀 Starting Aria Bot in background...');
    
    // Spawn the bot process in detached mode
    const botProcess = spawn('node', ['src/index.js'], {
        cwd: BOT_DIR,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Save the PID
    fs.writeFileSync(PID_FILE, botProcess.pid.toString());
    
    // Setup logging
    const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    
    // Add timestamp to logs
    botProcess.stdout.on('data', (data) => {
        const timestamp = new Date().toISOString();
        logStream.write(`[${timestamp}] ${data}`);
    });
    
    botProcess.stderr.on('data', (data) => {
        const timestamp = new Date().toISOString();
        logStream.write(`[${timestamp}] ERROR: ${data}`);
    });
    
    // Handle process events
    botProcess.on('error', (error) => {
        const timestamp = new Date().toISOString();
        logStream.write(`[${timestamp}] PROCESS ERROR: ${error.message}\n`);
        console.error('❌ Bot process error:', error);
    });
    
    botProcess.on('exit', (code, signal) => {
        const timestamp = new Date().toISOString();
        logStream.write(`[${timestamp}] Bot process exited with code ${code}, signal ${signal}\n`);
        
        // Clean up PID file
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
        }
        
        console.log(`Bot process exited with code ${code}`);
        
        // Auto-restart if it wasn't a manual shutdown
        if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
            console.log('🔄 Auto-restarting bot in 5 seconds...');
            setTimeout(startBot, 5000);
        }
    });
    
    // Unreference the process so parent can exit
    botProcess.unref();
    
    console.log(`✅ Bot started in background with PID: ${botProcess.pid}`);
    console.log(`📄 Logs: ${LOG_FILE}`);
    console.log('🔒 Bot will continue running even when terminal is closed');
    
    return botProcess;
}

// Start the bot
startBot();
