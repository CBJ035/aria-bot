import { Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes } from 'discord.js';
import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';
import AutoDisconnectService from './services/AutoDisconnectService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../config.json' assert { type: 'json' };
import chalk from 'chalk';
import figlet from 'figlet';
import Logger from './utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ASCII Art Banner
console.log('');
console.log('');
console.log(chalk.cyan(figlet.textSync('ARIA', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
})));

console.log(chalk.green('🎵 The most awesome music bot out there! Aria v3.0.0'));
console.log(chalk.blue('🚀 Powered by Discord Player & discord.js v14'));
console.log(chalk.yellow('⚡ Optimized for local hosting & Raspberry Pi'));
console.log('');

// Log bot startup
Logger.botStart();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Configure FFmpeg
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');
console.log(chalk.blue('🔧 FFmpeg path:'), ffmpegPath);

// Initialize discord-player
const player = new Player(client, {
    useLegacyFFmpeg: false,
    skipFFmpeg: false,
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        dlChunkSize: 0,
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }
    }
});

// Register YouTube extractor
player.extractors.register(YouTubeExtractor, {});

// Store player instance
client.player = player;

// Load commands
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log(chalk.blue(`📁 Loading ${commandFiles.length} commands...`));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileURL = pathToFileURL(filePath).href;
        
        try {
            const command = await import(fileURL);
            const commandData = command.default;
            
            if ('data' in commandData && 'execute' in commandData) {
                client.commands.set(commandData.data.name, commandData);
                console.log(chalk.green(`  ✅ Loaded: ${commandData.data.name}`));
            } else {
                console.log(chalk.yellow(`  ⚠️  Skipped: ${file} - Missing required properties`));
            }
        } catch (error) {
            console.log(chalk.red(`  ❌ Error loading ${file}:`, error.message));
        }
    }
}

// Load events
async function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    console.log(chalk.blue(`📁 Loading ${eventFiles.length} events...`));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const fileURL = pathToFileURL(filePath).href;
        
        try {
            const event = await import(fileURL);
            const eventData = event.default;
            
            if (eventData.once) {
                client.once(eventData.name, (...args) => eventData.execute(...args, client));
            } else {
                client.on(eventData.name, (...args) => eventData.execute(...args, client));
            }
            
            console.log(chalk.green(`  ✅ Loaded: ${eventData.name}`));
        } catch (error) {
            console.log(chalk.red(`  ❌ Error loading ${file}:`, error.message));
        }
    }
}

// Register slash commands
async function registerCommands() {
    const commands = [];
    client.commands.forEach(command => {
        commands.push(command.data.toJSON());
    });

    const rest = new REST().setToken(config.token);

    try {
        console.log(chalk.blue(`🔄 Refreshing ${commands.length} application (/) commands...`));

        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log(chalk.green(`✅ Successfully registered ${data.length} application (/) commands.`));
    } catch (error) {
        console.log(chalk.red('❌ Error registering commands:', error));
    }
}

// Store current "Now Playing" messages for cleanup
const nowPlayingMessages = new Map(); // guildId -> messageId
global.nowPlayingMessages = nowPlayingMessages; // Make it globally accessible

// Bot ready event
client.on('clientReady', () => {
    console.log(chalk.green('🎉 Bot is ready!'));
    console.log(chalk.cyan(`👤 Logged in as: ${client.user.tag}`));
    console.log(chalk.blue(`🏠 Serving ${client.guilds.cache.size} servers`));
    console.log(chalk.blue(`👥 Watching ${client.users.cache.size} users`));
    console.log(chalk.green('✅ Bot is now online and ready to play music!'));
    console.log(chalk.cyan('🎵 Use /play to add songs to the queue'));
    
    // Log bot ready status
    Logger.success(`Bot ready - ${client.guilds.cache.size} servers, ${client.users.cache.size} users`);
});

// Discord Player Events
player.events.on('playerStart', async (queue, track) => {
    console.log('');
    console.log(chalk.green('🎵 Discord Player: Song started playing'));
    console.log('Queue info - Current songs:', queue.tracks?.size || 0);
    console.log('Showing Now Playing embed for:', track.title);
    console.log('');
    
    // Log music play
    Logger.musicPlay(track.title);
    
    // Update activity for auto-disconnect monitoring
    const monitoringGuildId = queue.guild.id;
    AutoDisconnectService.updateActivity(monitoringGuildId);
    
    // Start monitoring using the guild ID
    console.log(chalk.cyan(`🔍 Monitoring Guild ID: ${monitoringGuildId}`));
    
    if (!AutoDisconnectService.monitoredGuilds.has(monitoringGuildId)) {
        console.log(chalk.blue(`🔍 Starting event-driven monitoring for guild ${monitoringGuildId}`));
        AutoDisconnectService.startMonitoring(monitoringGuildId, player, queue.connection.channel.id);
    } else {
        console.log(chalk.gray(`📊 Already monitoring guild ${monitoringGuildId}`));
    }
    
    // Delete previous "Now Playing" message if it exists
    const messageGuildId = queue.guild.id;
    if (nowPlayingMessages.has(messageGuildId)) {
        try {
            const oldMessageId = nowPlayingMessages.get(messageGuildId);
            const oldMessage = await queue.metadata.channel.messages.fetch(oldMessageId);
            await oldMessage.delete();
            console.log('🗑️ Deleted old Now Playing message');
        } catch (error) {
            console.log('Could not delete old message:', error.message);
        }
    }
    
    // Always show "Now Playing" message
    try {
        // Create initial embed
        const embed = new EmbedBuilder()
            .setColor('#00ff41')
            .setTitle('🎵 Aria started playing!')
            .setDescription(`**${track.title}**`)
            .setThumbnail(track.thumbnail)
            .addFields(
                { name: 'Duration', value: track.duration, inline: true },
                { name: 'Requested by', value: track.requestedBy?.toString() || 'Unknown', inline: true },
                { name: 'Volume', value: `${queue.node.volume}%`, inline: true }
            )
            .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
            .setTimestamp();
        
        // Send initial message and store its ID for later cleanup
        const message = await queue.metadata.channel.send({ embeds: [embed] });
        const guildId = queue.guild.id;
        nowPlayingMessages.set(guildId, message.id);
        
    } catch (embedError) {
        console.log('Error creating Now Playing embed:', embedError.message);
    }
});

player.events.on('trackAdd', (queue, track) => {
    console.log(chalk.blue('🎵 Discord Player: Song added to queue'));
});

player.events.on('playlistAdd', (queue, playlist) => {
    console.log(chalk.blue('📋 Discord Player: Playlist added to queue'));
    
    const embed = new EmbedBuilder()
        .setColor('#00ff41')
        .setTitle('📋 Your playlist was added to the queue')
        .setDescription(`**${playlist.title}**`)
        .setThumbnail(playlist.thumbnail)
        .addFields(
            { name: '🎵 Music Added', value: `${playlist.tracks.length}`, inline: true },
            { name: '👤 Requested by', value: playlist.requestedBy?.toString() || 'Unknown', inline: true }
        )
        .setFooter({ text: `Queue now has ${queue.tracks.size} songs` })
        .setTimestamp();
    
    queue.metadata.channel.send({ embeds: [embed] });
});

player.events.on('error', (queue, error) => {
    console.log(chalk.red('❌ Discord Player Error:', error.message || 'Unknown error'));
    Logger.errorOccurred(error, 'Discord Player');
    
    // Handle specific error types
    if (error.message && (
        error.message.includes('Could not parse decipher function') ||
        error.message.includes('Could not parse n transform function') ||
        error.message.includes('Unknown error')
    )) {
        console.log(chalk.yellow('⚠️ YouTube parsing error - this is usually temporary'));
        console.log(chalk.blue('💡 Try playing the song again in a few moments'));
        return;
    }
    
    if (error.message && error.message.includes('Video unavailable')) {
        console.log(chalk.yellow('⚠️ Video is unavailable - may be private, deleted, or region-restricted'));
        return;
    }
    
    // Send error message to channel
    if (queue.metadata.channel) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Playback Error')
            .setDescription(`An error occurred: ${error.message || 'Unknown error'}`)
            .setTimestamp();
        
        queue.metadata.channel.send({ embeds: [embed] }).catch(console.error);
    }
});

player.events.on('emptyQueue', (queue) => {
    console.log(chalk.yellow('📭 There is no music in the queue...'));
    // Update activity when queue becomes empty (starts inactivity timer)
    AutoDisconnectService.updateActivity(queue.guild.id);
});

player.events.on('emptyChannel', (queue) => {
    console.log(chalk.yellow('🏁 Channel is empty, leaving...'));
    // Stop monitoring when channel is empty
    AutoDisconnectService.manualDisconnect(queue.guild.id);
});

player.events.on('disconnect', (queue) => {
    console.log(chalk.yellow('👋 Disconnected from voice channel'));
    // Stop monitoring when disconnected
    AutoDisconnectService.manualDisconnect(queue.guild.id);
});

// Handle voice state updates to detect force disconnects and user changes
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if the bot was force disconnected
    if (oldState.member?.id === client.user.id && oldState.channel && !newState.channel) {
        console.log(chalk.yellow('🚫 Bot was force disconnected from voice channel'));
        
        // Stop any monitoring for this guild
        if (oldState.guild) {
            AutoDisconnectService.manualDisconnect(oldState.guild.id);
        }
        
        // Don't try to reconnect - respect the force disconnect
        const queue = player.nodes.get(oldState.guild);
        if (queue) {
            try {
                queue.delete();
                console.log(chalk.green('✅ Properly left voice channel after force disconnect'));
            } catch (error) {
                console.log('Voice leave error:', error.message);
            }
        }
    }
    
    // Handle user voice state changes for auto-disconnect
    await AutoDisconnectService.handleVoiceStateUpdate(oldState, newState);
});

// Remove duplicate empty event (already defined above)

// Initialize bot
async function init() {
    try {
        await loadCommands();
        await loadEvents();
        await registerCommands();
        
        console.log(chalk.blue('🔐 Logging in to Discord...'));
        await client.login(config.token);
    } catch (error) {
        console.log(chalk.red('❌ Failed to initialize bot:', error));
        process.exit(1);
    }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.log(chalk.red('❌ Unhandled Rejection at:', promise, 'reason:', reason));
});

process.on('uncaughtException', (error) => {
    console.log(chalk.red('❌ Uncaught Exception:', error));
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('🛑 Received SIGINT, shutting down gracefully...'));
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('🛑 Received SIGTERM, shutting down gracefully...'));
    client.destroy();
    process.exit(0);
});

// Start the bot
init();
