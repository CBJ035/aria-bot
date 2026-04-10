#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

const homeDir = os.homedir();
const launchAgentsDir = path.join(homeDir, 'Library', 'LaunchAgents');
const plistDest = path.join(launchAgentsDir, 'com.aria.bot.plist');

console.log('🗑️  Uninstalling Aria Bot Launch Agent...');

try {
    // Unload the service if it exists
    if (fs.existsSync(plistDest)) {
        try {
            execSync(`launchctl unload ${plistDest}`, { stdio: 'inherit' });
            console.log('⏹️  Unloaded Launch Agent');
        } catch (error) {
            console.log('⚠️  Service was not loaded');
        }

        // Remove the plist file
        fs.unlinkSync(plistDest);
        console.log('🗑️  Removed plist file');
    } else {
        console.log('⚠️  Service was not installed');
    }

    console.log('');
    console.log('✅ Aria Bot service has been uninstalled');
    console.log('💡 You can still run the bot manually with npm start or npm run start:bg');

} catch (error) {
    console.error('❌ Error uninstalling service:', error.message);
    process.exit(1);
}
