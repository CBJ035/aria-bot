import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

class VotingService {
    constructor() {
        this.activeVotes = new Map(); // guildId -> { type, data, votes, required, expires }
        this.userCooldowns = new Map(); // userId -> timestamp
    }

    // Check if user has permission to bypass voting
    hasPermission(member, queue) {
        // Check if user is server moderator/admin
        if (member.permissions.has(['ManageGuild']) || 
            member.permissions.has(['Administrator']) || 
            member.permissions.has(['ManageChannels'])) {
            return true;
        }

        // Check if user is the one who requested the current song
        if (queue && queue.songs[0] && queue.songs[0].user?.id === member.id) {
            return true;
        }

        return false;
    }

    // Get voice channel members count (excluding bots)
    getVoiceChannelSize(voiceChannel) {
        return voiceChannel.members.filter(member => !member.user.bot).size;
    }

    // Check if voting is required
    requiresVoting(interaction, queue) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return false;

        const memberCount = this.getVoiceChannelSize(voiceChannel);
        
        // If only 1-2 people, no voting needed
        if (memberCount <= 2) return false;

        // If user has permission, no voting needed
        if (this.hasPermission(interaction.member, queue)) return false;

        return true;
    }

    // Start a vote
    async startVote(interaction, command, data = {}) {
        const guildId = interaction.guild.id;
        const voiceChannel = interaction.member.voice.channel;
        const memberCount = this.getVoiceChannelSize(voiceChannel);
        const requiredVotes = Math.ceil(memberCount / 2);

        // Check if there's already an active vote
        if (this.activeVotes.has(guildId)) {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('⚠️ Vote Already Active')
                .setDescription('There is already an active vote. Please wait for it to finish.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // Create vote data
        const voteData = {
            type: command,
            data: data,
            votes: new Set([interaction.user.id]), // Initiator automatically votes yes
            required: requiredVotes,
            expires: Date.now() + 30000, // 30 seconds
            initiator: interaction.user.id,
            voiceChannel: voiceChannel.id
        };

        this.activeVotes.set(guildId, voteData);

        // Create vote embed
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle(`🗳️ Vote: ${this.getCommandTitle(command)}`)
            .setDescription(this.getVoteDescription(command, data))
            .addFields(
                { name: '📊 Progress', value: `${voteData.votes.size}/${requiredVotes} votes`, inline: true },
                { name: '👥 Voice Channel', value: `${memberCount} members`, inline: true },
                { name: '⏰ Time Left', value: '30 seconds', inline: true },
                { name: '💡 How to Vote', value: 'Use the same command again to vote YES, or wait for it to expire', inline: false }
            )
            .setFooter({ text: `Started by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Auto-expire vote after 30 seconds
        setTimeout(() => {
            if (this.activeVotes.has(guildId)) {
                this.expireVote(guildId, interaction.channel);
            }
        }, 30000);

        return true; // Vote started
    }

    // Add vote to existing vote
    async addVote(interaction, command) {
        const guildId = interaction.guild.id;
        const voteData = this.activeVotes.get(guildId);

        if (!voteData || voteData.type !== command) {
            return false; // No matching vote
        }

        // Check if user is in the same voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== voteData.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Not in Voice Channel')
                .setDescription('You must be in the same voice channel to vote!')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return true; // Vote exists but user can't vote
        }

        // Check if user already voted
        if (voteData.votes.has(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('⚠️ Already Voted')
                .setDescription('You have already voted for this action!')
                .addFields(
                    { name: '📊 Current Progress', value: `${voteData.votes.size}/${voteData.required} votes`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return true;
        }

        // Add vote
        voteData.votes.add(interaction.user.id);

        // Check if vote passed
        if (voteData.votes.size >= voteData.required) {
            this.activeVotes.delete(guildId);
            await this.executeVotedAction(interaction, voteData);
            return true;
        }

        // Update vote progress
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Vote Added')
            .setDescription(`Your vote has been counted!`)
            .addFields(
                { name: '📊 Progress', value: `${voteData.votes.size}/${voteData.required} votes`, inline: true },
                { name: '⏰ Status', value: `${voteData.required - voteData.votes.size} more votes needed`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return true;
    }

    // Execute the voted action
    async executeVotedAction(interaction, voteData) {
        const distube = interaction.client.distube;
        const queue = distube.getQueue(interaction.guild);

        try {
            let embed;
            
            switch (voteData.type) {
                case 'skip':
                    const amount = voteData.data.amount || 1;
                    for (let i = 0; i < amount; i++) {
                        if (queue && queue.songs.length > 0) {
                            await distube.skip(interaction.guild);
                            if (i < amount - 1) await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                    embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Vote Passed - Track Skipped')
                        .setDescription(`Skipped ${amount} track(s) by community vote!`)
                        .setTimestamp();
                    break;

                case 'stop':
                    distube.stop(interaction.guild);
                    embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('✅ Vote Passed - Music Stopped')
                        .setDescription('Music stopped by community vote!')
                        .setTimestamp();
                    break;

                case 'volume':
                    distube.setVolume(interaction.guild, voteData.data.volume);
                    embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Vote Passed - Volume Changed')
                        .setDescription(`Volume set to ${voteData.data.volume}% by community vote!`)
                        .setTimestamp();
                    break;

                case 'shuffle':
                    await distube.shuffle(interaction.guild);
                    embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Vote Passed - Queue Shuffled')
                        .setDescription('Queue shuffled by community vote!')
                        .setTimestamp();
                    break;

                case 'remove':
                    if (queue && queue.songs[voteData.data.position]) {
                        const removedSong = queue.songs[voteData.data.position];
                        queue.songs.splice(voteData.data.position, 1);
                        embed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('✅ Vote Passed - Track Removed')
                            .setDescription(`Removed **${removedSong.name}** by community vote!`)
                            .setTimestamp();
                    }
                    break;

                default:
                    embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Vote Passed')
                        .setDescription('Action executed by community vote!')
                        .setTimestamp();
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Vote execution error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Vote Execution Failed')
                .setDescription('The voted action could not be completed.')
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });
        }
    }

    // Expire a vote
    async expireVote(guildId, channel) {
        const voteData = this.activeVotes.get(guildId);
        if (!voteData) return;

        this.activeVotes.delete(guildId);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⏰ Vote Expired')
            .setDescription(`${this.getCommandTitle(voteData.type)} vote expired without enough votes.`)
            .addFields(
                { name: '📊 Final Result', value: `${voteData.votes.size}/${voteData.required} votes`, inline: true }
            )
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.log('Could not send vote expiry message:', error.message);
        }
    }

    // Helper methods
    getCommandTitle(command) {
        const titles = {
            skip: 'Skip Track',
            stop: 'Stop Music',
            volume: 'Change Volume',
            shuffle: 'Shuffle Queue',
            remove: 'Remove Track'
        };
        return titles[command] || command;
    }

    getVoteDescription(command, data) {
        switch (command) {
            case 'skip':
                return data.amount > 1 ? `Skip the next ${data.amount} tracks?` : 'Skip the current track?';
            case 'stop':
                return 'Stop the music and clear the queue?';
            case 'volume':
                return `Change volume to ${data.volume}%?`;
            case 'shuffle':
                return 'Shuffle the current queue?';
            case 'remove':
                return `Remove track at position ${data.position}?`;
            default:
                return 'Execute this action?';
        }
    }

    // Clean up expired votes
    cleanup() {
        const now = Date.now();
        for (const [guildId, voteData] of this.activeVotes.entries()) {
            if (now > voteData.expires) {
                this.activeVotes.delete(guildId);
            }
        }
    }
}

export default new VotingService();
