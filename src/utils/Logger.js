import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'bot.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
    constructor() {
        this.logFile = LOG_FILE;
    }

    // Strip ANSI color codes for file logging
    stripColors(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    }

    // Write to both console and file
    log(message, color = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Console output with colors
        if (color) {
            console.log(color(logMessage));
        } else {
            console.log(logMessage);
        }
        
        // File output without colors
        const fileMessage = this.stripColors(logMessage);
        fs.appendFileSync(this.logFile, fileMessage + '\n');
    }

    // Colored log methods
    info(message) {
        this.log(message, chalk.blue);
    }

    success(message) {
        this.log(message, chalk.green);
    }

    warning(message) {
        this.log(message, chalk.yellow);
    }

    error(message) {
        this.log(message, chalk.red);
    }

    debug(message) {
        this.log(message, chalk.gray);
    }

    // Special methods for bot events
    botStart() {
        this.success('🎉 Bot is ready!');
    }

    botStop() {
        this.warning('🛑 Bot stopped');
    }

    musicPlay(songName) {
        this.info(`🎵 Now playing: ${songName}`);
    }

    musicStop() {
        this.info('⏹️ Music stopped');
    }

    commandUsed(command, user) {
        this.info(`📝 Command used: /${command} by ${user}`);
    }

    errorOccurred(error, context = '') {
        this.error(`❌ Error${context ? ` in ${context}` : ''}: ${error.message}`);
    }
}

export default new Logger();
