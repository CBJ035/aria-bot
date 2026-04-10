import chalk from 'chalk';

class AutoDisconnectService {
    constructor() {
        this.monitoredGuilds = new Map(); // guildId -> { distube, lastActivity }
        this.inactivityTimeout = 60000; // 1 minute of inactivity
        this.emptyChannelTimeout = 30000; // 30 seconds for empty channel
        this.disconnectTimers = new Map(); // guildId -> timeoutId for delayed disconnects
    }

    // Start monitoring a guild (event-driven)
    startMonitoring(guildId, distube, voiceChannelId) {
        console.log(chalk.blue(`🔍 [Guild ${guildId}] Starting event-driven auto-disconnect monitoring for channel ${voiceChannelId}`));
        
        this.monitoredGuilds.set(guildId, {
            distube: distube,
            voiceChannelId: voiceChannelId,
            lastActivity: Date.now()
        });
        
        console.log(chalk.green(`✅ [Guild ${guildId}] Event-driven monitoring started for channel ${voiceChannelId}. Total monitored: ${this.monitoredGuilds.size}`));
        console.log('');
    }

    // Stop monitoring a guild
    stopMonitoring(guildId) {
        if (this.monitoredGuilds.has(guildId)) {
            this.monitoredGuilds.delete(guildId);
            console.log(chalk.yellow(`⏹️ [Guild ${guildId}] Stopped monitoring. Remaining: ${this.monitoredGuilds.size}`));
            console.log('');
        }
        
        // Clear any pending disconnect timer
        if (this.disconnectTimers.has(guildId)) {
            clearTimeout(this.disconnectTimers.get(guildId));
            this.disconnectTimers.delete(guildId);
        }
    }

    // Update last activity time
    updateActivity(guildId) {
        const guildData = this.monitoredGuilds.get(guildId);
        if (guildData) {
            guildData.lastActivity = Date.now();
            console.log(chalk.green(`🔄 [Guild ${guildId}] Updated activity`));
            console.log('');
        }
    }

    // Handle voice state updates (called from index.js)
    async handleVoiceStateUpdate(oldState, newState) {
        const guildId = oldState.guild.id;
        
        // Only process if we're monitoring this guild
        if (!this.monitoredGuilds.has(guildId)) {
            return;
        }
        
        const guildData = this.monitoredGuilds.get(guildId);
        const monitoredChannelId = guildData.voiceChannelId;
        
        // Process if someone left a voice channel
        if (oldState.channelId && !newState.channelId) {
            const channelId = oldState.channelId;
            
            // Only check if they left OUR monitored channel
            if (channelId === monitoredChannelId) {
                console.log(chalk.blue(`👋 [Guild ${guildId}] User left monitored voice channel ${channelId}`));
                await this.checkChannelAfterUserLeft(guildId, channelId);
            } else {
                console.log(chalk.gray(`👋 [Guild ${guildId}] User left different voice channel ${channelId} (monitoring ${monitoredChannelId})`));
            }
        }
        
        // Process if someone joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            const channelId = newState.channelId;
            
            // Only check if they joined OUR monitored channel
            if (channelId === monitoredChannelId) {
                console.log(chalk.green(`👋 [Guild ${guildId}] User joined monitored voice channel ${channelId}`));
                await this.checkChannelAfterUserJoined(guildId, channelId);
            } else {
                console.log(chalk.gray(`👋 [Guild ${guildId}] User joined different voice channel ${channelId} (monitoring ${monitoredChannelId})`));
            }
        }
        
        // Process if someone moved between channels
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const leftChannelId = oldState.channelId;
            const joinedChannelId = newState.channelId;
            
            // Check if they left our monitored channel
            if (leftChannelId === monitoredChannelId) {
                console.log(chalk.blue(`🔄 [Guild ${guildId}] User left monitored channel ${leftChannelId} for ${joinedChannelId}`));
                await this.checkChannelAfterUserLeft(guildId, leftChannelId);
            }
            
            // Check if they joined our monitored channel
            if (joinedChannelId === monitoredChannelId) {
                console.log(chalk.green(`🔄 [Guild ${guildId}] User joined monitored channel ${joinedChannelId} from ${leftChannelId}`));
                await this.checkChannelAfterUserJoined(guildId, joinedChannelId);
            }
            
            // If neither channel is ours, just log it
            if (leftChannelId !== monitoredChannelId && joinedChannelId !== monitoredChannelId) {
                console.log(chalk.gray(`🔄 [Guild ${guildId}] User moved between other channels ${leftChannelId} -> ${joinedChannelId} (monitoring ${monitoredChannelId})`));
            }
        }
        
        console.log('');
    }

    // Check channel after a user left
    async checkChannelAfterUserLeft(guildId, channelId) {
        const guildData = this.monitoredGuilds.get(guildId);
        if (!guildData) return;

        const { distube } = guildData;
        
        try {
            // Get the voice channel
            const guild = distube.client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(chalk.red(`❌ [Guild ${guildId}] Guild not found`));
                return;
            }

            const voiceChannel = guild.channels.cache.get(channelId);
            if (!voiceChannel) {
                console.log(chalk.red(`❌ [Guild ${guildId}] Voice channel not found`));
                return;
            }

            // Count real users (excluding bots)
            const realUsers = voiceChannel.members.filter(member =>
                !member.user.bot && member.user.id !== guild.members.me.id
            );
            const userCount = realUsers.size;

            console.log('');
            console.log(chalk.blue(`👥 [Guild ${guildId}] ${userCount} real users remaining in voice channel`));
            console.log(chalk.gray(`👤 Real users: ${realUsers.map(m => m.user.username).join(', ') || 'None'}`));
            console.log(chalk.gray(`🤖 Bots: ${voiceChannel.members.filter(m => m.user.bot).map(m => m.user.username).join(', ')}`));
            console.log('');

            // If no real users, schedule disconnect
            if (userCount === 0) {
                console.log(chalk.yellow(`📭 [Guild ${guildId}] Voice channel empty - scheduling disconnect in ${this.emptyChannelTimeout/1000}s`));
                
                // Clear any existing timer
                if (this.disconnectTimers.has(guildId)) {
                    clearTimeout(this.disconnectTimers.get(guildId));
                }
                
                // Schedule disconnect
                const timerId = setTimeout(async () => {
                    await this.disconnect(guildId, distube, 'Voice channel is empty');
                }, this.emptyChannelTimeout);
                
                this.disconnectTimers.set(guildId, timerId);
            } else {
                // Cancel any pending disconnect if users are present
                if (this.disconnectTimers.has(guildId)) {
                    clearTimeout(this.disconnectTimers.get(guildId));
                    this.disconnectTimers.delete(guildId);
                    console.log(chalk.green(`✅ [Guild ${guildId}] Canceled disconnect - users present`));
                }
            }

        } catch (error) {
            console.log(chalk.red(`❌ Error checking channel after user left:`, error.message));
        }
    }

    // Check channel after a user joined
    async checkChannelAfterUserJoined(guildId, channelId) {
        const guildData = this.monitoredGuilds.get(guildId);
        
        // If we're not monitoring this guild, check if we should start monitoring
        if (!guildData) {
            // Check if bot is in this channel and should start monitoring
            const distube = this.getDistubeInstance();
            if (distube) {
                const queue = distube.getQueue(guildId);
                if (queue && queue.voiceChannel && queue.voiceChannel.id === channelId) {
                    console.log(chalk.blue(`🔄 [Guild ${guildId}] User joined our channel, restarting monitoring`));
                    this.startMonitoring(guildId, distube, channelId);
                }
            }
            return;
        }

        const { distube, voiceChannelId } = guildData;
        
        // Only process if this is our monitored channel
        if (channelId !== voiceChannelId) {
            console.log(chalk.gray(`👋 [Guild ${guildId}] User joined different channel ${channelId} (monitoring ${voiceChannelId})`));
            return;
        }
        
        try {
            // Get the voice channel
            const guild = distube.client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(chalk.red(`❌ [Guild ${guildId}] Guild not found`));
                return;
            }

            const voiceChannel = guild.channels.cache.get(channelId);
            if (!voiceChannel) {
                console.log(chalk.red(`❌ [Guild ${guildId}] Voice channel not found`));
                return;
            }

            // Count real users (excluding bots)
            const realUsers = voiceChannel.members.filter(member =>
                !member.user.bot && member.user.id !== guild.members.me.id
            );
            const userCount = realUsers.size;

            console.log(chalk.green(`👥 [Guild ${guildId}] ${userCount} real users now in voice channel`));
            console.log(chalk.gray(`👤 Real users: ${realUsers.map(m => m.user.username).join(', ') || 'None'}`));
            console.log(chalk.gray(`🤖 Bots: ${voiceChannel.members.filter(m => m.user.bot).map(m => m.user.username).join(', ')}`));

            // If users are present, cancel any pending disconnect
            if (userCount > 0) {
                if (this.disconnectTimers.has(guildId)) {
                    clearTimeout(this.disconnectTimers.get(guildId));
                    this.disconnectTimers.delete(guildId);
                    console.log(chalk.green(`✅ [Guild ${guildId}] Canceled disconnect - users present`));
                }
                
                // If we're not monitoring this guild anymore (bot disconnected), restart monitoring
                if (!this.monitoredGuilds.has(guildId)) {
                    console.log(chalk.blue(`🔄 [Guild ${guildId}] Restarting monitoring - users rejoined`));
                    this.startMonitoring(guildId, distube);
                    
                    // Check if bot needs to rejoin the voice channel
                    const botMember = guild.members.me;
                    if (!botMember?.voice?.channel) {
                        console.log(chalk.yellow(`🤖 [Guild ${guildId}] Bot not in voice channel - user needs to use /play to invite bot back`));
                    }
                }
            }

        } catch (error) {
            console.log(chalk.red(`❌ Error checking channel after user joined:`, error.message));
        }
    }

    // Disconnect from guild
    async disconnect(guildId, distube, reason) {
        try {
            const queue = distube.getQueue(guildId);
            console.log('');
            console.log(chalk.blue(`🚪 [Guild ${guildId}] Starting disconnect process: ${reason}`));
            
            if (queue) {
                // Delete "Now Playing" message immediately if it exists
                try {
                    const nowPlayingMessages = global.nowPlayingMessages;
                    if (nowPlayingMessages && nowPlayingMessages.has(guildId)) {
                        const oldMessageId = nowPlayingMessages.get(guildId);
                        const oldMessage = await queue.textChannel.messages.fetch(oldMessageId);
                        await oldMessage.delete();
                        nowPlayingMessages.delete(guildId);
                    }
                } catch (deleteError) {
                    console.log('Could not delete Now Playing message:', deleteError.message);
                }

                // Send goodbye message
                const { EmbedBuilder } = await import('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('Party is dead, see ya 💤')
                    .setDescription(`Disconnecting: ${reason}`)
                    .addFields(
                        { name: '💡 Tip', value: 'Invite me with `/play` if there is a new party!', inline: false }
                    )
                    .setTimestamp();

                let goodbyeMessage = null;
                try {
                    goodbyeMessage = await queue.textChannel.send({ embeds: [embed] });
                    console.log(chalk.green(`💬 [Guild ${guildId}] Sent goodbye message`));
                } catch (msgError) {
                    console.log('Could not send goodbye message:', msgError.message);
                }

                // Stop the music first
                try {
                    distube.stop(guildId);
                    console.log(chalk.green(`⏹️ [Guild ${guildId}] Stopped music`));
                } catch (stopError) {
                    console.log('Could not stop music:', stopError.message);
                }

                // Force leave voice channel
                try {
                    await distube.voices.leave(guildId);
                    console.log(chalk.green(`🚪 [Guild ${guildId}] Left voice channel via DisTube`));
                } catch (leaveError) {
                    console.log('DisTube leave failed:', leaveError.message);
                    
                    // Try alternative method via Discord.js
                    try {
                        const guild = queue.textChannel.guild;
                        const connection = guild.members.me?.voice?.connection;
                        if (connection) {
                            connection.destroy();
                            console.log(chalk.green(`🚪 [Guild ${guildId}] Left voice channel via Discord.js`));
                        }
                    } catch (altLeaveError) {
                        console.log('Alternative leave method failed:', altLeaveError.message);
                    }
                }

                // Delete goodbye message after 5 seconds
                if (goodbyeMessage) {
                    setTimeout(async () => {
                        try {
                            await goodbyeMessage.delete();
                            console.log(chalk.green(`🗑️ [Guild ${guildId}] Deleted goodbye message`));
                        } catch (deleteError) {
                            console.log('Could not delete goodbye message:', deleteError.message);
                        }
                    }, 5000);
                }
            }

            this.stopMonitoring(guildId);
            console.log(chalk.green(`✅ [Guild ${guildId}] Disconnect process completed: ${reason}`));

        } catch (error) {
            console.log(chalk.red(`❌ Error disconnecting from guild ${guildId}:`, error.message));
            this.stopMonitoring(guildId);
        }
    }

    // Manual disconnect (for stop command)
    manualDisconnect(guildId) {
        this.stopMonitoring(guildId);
        console.log(chalk.blue(`🛑 Manual disconnect for guild ${guildId}`));
    }

    // Get distube instance from any monitored guild
    getDistubeInstance() {
        for (const [guildId, guildData] of this.monitoredGuilds) {
            if (guildData.distube) {
                return guildData.distube;
            }
        }
        return null;
    }

    // Get monitoring status
    getStatus() {
        return {
            monitoredGuilds: this.monitoredGuilds.size,
            pendingDisconnects: this.disconnectTimers.size
        };
    }
}

export default new AutoDisconnectService();