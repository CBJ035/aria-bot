#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DIR = path.join(__dirname, '..');

const homeDir = os.homedir();
const launchAgentsDir = path.join(homeDir, 'Library', 'LaunchAgents');
const plistSource = path.join(__dirname, 'com.aria.bot.plist');
const plistDest = path.join(launchAgentsDir, 'com.aria.bot.plist');

console.log('🔧 Installing Aria Bot as macOS Launch Agent...');

try {
    // Ensure LaunchAgents directory exists
    if (!fs.existsSync(launchAgentsDir)) {
        fs.mkdirSync(launchAgentsDir, { recursive: true });
        console.log('📁 Created LaunchAgents directory');
    }

    // Update the plist with correct paths
    let plistContent = fs.readFileSync(plistSource, 'utf8');
    plistContent = plistContent.replace(
        '/Users/chris/Documents/GitHub/aria-bot',
        BOT_DIR
    );

    // Write the updated plist
    fs.writeFileSync(plistDest, plistContent);
    console.log('📄 Copied plist file to LaunchAgents');

    // Load the service
    execSync(`launchctl load ${plistDest}`, { stdio: 'inherit' });
    console.log('🚀 Loaded Launch Agent');

    console.log('');
    console.log('✅ Aria Bot is now installed as a system service!');
    console.log('🔄 It will automatically start on login and restart if it crashes');
    console.log('');
    console.log('💡 Useful commands:');
    console.log('  • Start service: launchctl start com.aria.bot');
    console.log('  • Stop service: launchctl stop com.aria.bot');
    console.log('  • Uninstall: npm run uninstall-service');
    console.log('  • View logs: tail -f logs/daemon.log');

} catch (error) {
    console.error('❌ Error installing service:', error.message);
    process.exit(1);
}
