#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, 'logs', 'bot.log');

console.log('📊 Aria Bot - Real-time Log Viewer');
console.log('─'.repeat(50));
console.log('Press Ctrl+C to exit');
console.log('─'.repeat(50));
console.log('');

// Check if log file exists
import fs from 'fs';
if (!fs.existsSync(LOG_FILE)) {
    console.log('❌ Log file not found. Start the bot first to generate logs.');
    process.exit(1);
}

// Show recent logs first
try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = logs.split('\n').slice(-20); // Last 20 lines
    
    console.log('📋 Recent logs:');
    console.log('─'.repeat(30));
    lines.forEach(line => {
        if (line.trim()) {
            console.log(line); // Print raw line to preserve any colors
        }
    });
    console.log('─'.repeat(30));
    console.log('');
} catch (error) {
    console.log('❌ Error reading recent logs:', error.message);
}

console.log('🔄 Starting real-time log stream...');
console.log('');

// Set up real-time log monitoring
const tailProcess = spawn('tail', ['-f', LOG_FILE], {
    cwd: __dirname,
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
    console.log('❌ Log stream error:', data.toString());
});

// Handle process exit
tailProcess.on('close', (code) => {
    console.log('\n📊 Log stream ended');
    process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n📊 Exiting log viewer...');
    tailProcess.kill();
    process.exit(0);
});

console.log('💡 Tip: Press Ctrl+C to exit');
