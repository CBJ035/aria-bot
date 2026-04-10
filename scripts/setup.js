#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DIR = path.join(__dirname, '..');

console.clear();
console.log(chalk.cyan(figlet.textSync('ARIA SETUP', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
})));

console.log(chalk.green('🎵 Discord Music Bot Setup v3.0.0'));
console.log(chalk.blue('🚀 Lets configure your bot!'));
console.log('');

class AriaSetup {
    constructor() {
        this.config = {};
        this.configPath = path.join(BOT_DIR, 'config.json');
    }

    async init() {
        console.log(chalk.yellow('📋 This setup will help you configure Aria Bot'));
        console.log(chalk.gray('You can always edit config.json manually later'));
        console.log('');

        await this.loadExistingConfig();
        await this.setupDiscord();
        await this.setupSpotify();
        await this.setupSettings();
        await this.saveConfig();
        
        console.log('');
        console.log(chalk.green('🎉 Setup completed successfully!'));
        console.log(chalk.blue('💡 Next steps:'));
        console.log(chalk.white('  1. Run: npm install'));
        console.log(chalk.white('  2. Run: npm start (or use the admin panel)'));
        console.log(chalk.white('  3. Invite your bot to a Discord server'));
        console.log('');
        console.log(chalk.cyan('🎵 Enjoy your music bot!'));
    }

    async loadExistingConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                console.log(chalk.blue('📁 Found existing configuration'));
            } else {
                this.config = {
                    token: '',
                    clientId: '',
                    ownerId: '',
                    prefix: '!',
                    spotify: {
                        clientId: '',
                        clientSecret: ''
                    },
                    settings: {
                        autoDisconnectTimeout: 300000,
                        maxQueueSize: 100,
                        defaultVolume: 50,
                        allowExplicit: true,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 30000,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 30000
                    },
                    admin: {
                        port: 3000,
                        enabled: true
                    }
                };
            }
        } catch (error) {
            console.log(chalk.red('❌ Error loading existing config:', error.message));
            this.config = {};
        }
    }

    async setupDiscord() {
        console.log(chalk.blue('🤖 Discord Bot Configuration'));
        console.log(chalk.gray('Get these from https://discord.com/developers/applications'));
        console.log('');

        const discordQuestions = [
            {
                type: 'input',
                name: 'token',
                message: 'Discord Bot Token:',
                default: this.config.token || '',
                validate: (input) => {
                    if (!input || input.length < 50) {
                        return 'Please enter a valid Discord bot token';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'clientId',
                message: 'Discord Application ID:',
                default: this.config.clientId || '',
                validate: (input) => {
                    if (!input || input.length < 17) {
                        return 'Please enter a valid Discord application ID';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'ownerId',
                message: 'Your Discord User ID (optional):',
                default: this.config.ownerId || ''
            }
        ];

        const discordAnswers = await inquirer.prompt(discordQuestions);
        
        this.config.token = discordAnswers.token;
        this.config.clientId = discordAnswers.clientId;
        this.config.ownerId = discordAnswers.ownerId;
        
        console.log(chalk.green('✅ Discord configuration completed'));
        console.log('');
    }

    async setupSpotify() {
        console.log(chalk.green('🎵 Spotify Integration (Optional)'));
        console.log(chalk.gray('Get these from https://developer.spotify.com/dashboard'));
        console.log('');

        const { enableSpotify } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'enableSpotify',
                message: 'Do you want to enable Spotify integration?',
                default: !!(this.config.spotify?.clientId)
            }
        ]);

        if (enableSpotify) {
            const spotifyQuestions = [
                {
                    type: 'input',
                    name: 'clientId',
                    message: 'Spotify Client ID:',
                    default: this.config.spotify?.clientId || '',
                    validate: (input) => {
                        if (!input || input.length < 10) {
                            return 'Please enter a valid Spotify client ID';
                        }
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'clientSecret',
                    message: 'Spotify Client Secret:',
                    default: this.config.spotify?.clientSecret || '',
                    validate: (input) => {
                        if (!input || input.length < 10) {
                            return 'Please enter a valid Spotify client secret';
                        }
                        return true;
                    }
                }
            ];

            const spotifyAnswers = await inquirer.prompt(spotifyQuestions);
            
            this.config.spotify = {
                clientId: spotifyAnswers.clientId,
                clientSecret: spotifyAnswers.clientSecret
            };
            
            console.log(chalk.green('✅ Spotify integration configured'));
        } else {
            this.config.spotify = {
                clientId: '',
                clientSecret: ''
            };
            console.log(chalk.yellow('⏭️  Spotify integration skipped'));
        }
        
        console.log('');
    }

    async setupSettings() {
        console.log(chalk.purple('⚙️  Bot Settings'));
        console.log('');

        const settingsQuestions = [
            {
                type: 'number',
                name: 'defaultVolume',
                message: 'Default volume (0-100):',
                default: this.config.settings?.defaultVolume || 50,
                validate: (input) => {
                    if (input < 0 || input > 100) {
                        return 'Volume must be between 0 and 100';
                    }
                    return true;
                }
            },
            {
                type: 'number',
                name: 'maxQueueSize',
                message: 'Maximum queue size:',
                default: this.config.settings?.maxQueueSize || 100,
                validate: (input) => {
                    if (input < 1) {
                        return 'Queue size must be at least 1';
                    }
                    return true;
                }
            },
            {
                type: 'confirm',
                name: 'leaveOnEmpty',
                message: 'Leave voice channel when empty?',
                default: this.config.settings?.leaveOnEmpty ?? true
            },
            {
                type: 'confirm',
                name: 'leaveOnEnd',
                message: 'Leave voice channel when queue ends?',
                default: this.config.settings?.leaveOnEnd ?? true
            }
        ];

        const settingsAnswers = await inquirer.prompt(settingsQuestions);
        
        this.config.settings = {
            ...this.config.settings,
            defaultVolume: settingsAnswers.defaultVolume,
            maxQueueSize: settingsAnswers.maxQueueSize,
            leaveOnEmpty: settingsAnswers.leaveOnEmpty,
            leaveOnEnd: settingsAnswers.leaveOnEnd
        };
        
        console.log(chalk.green('✅ Bot settings configured'));
        console.log('');
    }

    async saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
            console.log(chalk.green('💾 Configuration saved to config.json'));
        } catch (error) {
            console.log(chalk.red('❌ Error saving configuration:', error.message));
            throw error;
        }
    }
}

const setup = new AriaSetup();
setup.init().catch(console.error);
