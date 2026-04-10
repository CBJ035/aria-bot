import { Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes } from 'discord.js';
import { DisTube } from 'distube';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../config.json' assert { type: 'json' };
import chalk from 'chalk';
import figlet from 'figlet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ASCII Art Banner
console.log(chalk.cyan(figlet.textSync('ARIA BOT', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
})));

console.log(chalk.green('🎵 Modern Discord Music Bot v3.0.0'));
console.log(chalk.blue('🚀 Powered by DisTube & discord.js v14'));
console.log(chalk.yellow('⚡ Optimized for local hosting & Raspberry Pi'));
console.log('');

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

// Initialize DisTube
const distube = new DisTube(client, {
    leaveOnEmpty: false,
    leaveOnFinish: false,
    leaveOnStop: false,
    savePreviousSongs: true,
    searchSongs: 10,
    searchCooldown: 30,
    youtubeDL: false,
    ffmpeg: {
        path: ffmpegPath
    }
});

// Store distube instance
client.distube = distube;

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

// DisTube Events
distube.on('playSong', (queue, song) => {
    console.log(chalk.green('🎵 DisTube: Song started playing'));
    
    const embed = new EmbedBuilder()
        .setColor('#00ff41')
        .setTitle('🎵 Now Playing')
        .setDescription(`**${song.name}**`)
        .setThumbnail(song.thumbnail)
        .addFields(
            { name: 'Duration', value: song.formattedDuration, inline: true },
            { name: 'Requested by', value: song.user?.toString() || 'Unknown', inline: true },
            { name: 'Volume', value: `${queue.volume}%`, inline: true }
        )
        .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
        .setTimestamp();
    
    queue.textChannel.send({ embeds: [embed] });
});

distube.on('addSong', (queue, song) => {
    console.log(chalk.blue('🎵 DisTube: Song added to queue'));
    
    if (queue.songs.length > 1) {
        const embed = new EmbedBuilder()
            .setColor('#00ff41')
            .setTitle('🎵 Added to Queue')
            .setDescription(`**${song.name}**`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: 'Duration', value: song.formattedDuration, inline: true },
                { name: 'Position', value: `${queue.songs.length}`, inline: true },
                { name: 'Requested by', value: song.user?.toString() || 'Unknown', inline: true }
            )
            .setFooter({ text: `Queue: ${queue.songs.length} songs` })
            .setTimestamp();
        
        queue.textChannel.send({ embeds: [embed] });
    }
});

distube.on('error', (channel, error) => {
    console.log(chalk.red('❌ DisTube Error:', error.message));
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Playback Error')
        .setDescription('An error occurred while playing music.')
        .setTimestamp();
    
    if (channel) channel.send({ embeds: [embed] });
});

distube.on('empty', queue => {
    console.log(chalk.yellow('📭 Queue is empty'));
});

distube.on('finish', queue => {
    console.log(chalk.yellow('🏁 Queue finished'));
});

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
