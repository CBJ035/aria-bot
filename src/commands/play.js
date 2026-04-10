import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import SpotifyService from '../services/SpotifyService.js';
import chalk from 'chalk';

// Helper function to auto-delete responses after 5 seconds
async function autoDeleteResponse(interaction, delay = 5000) {
    setTimeout(async () => {
        try {
            await interaction.deleteReply();
        } catch (error) {
            // Ignore errors (message might already be deleted)
        }
    }, delay);
}

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Used to play music... duh.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Give me whatever, I\'ll play it.')
                .setRequired(true)
        ),
    
    cooldown: 3,
    
    async execute(interaction, client) {
        // Check if interaction is still valid
        if (!interaction.isRepliable()) {
            console.log('❌ Interaction is no longer repliable');
            return;
        }

        try {
            await interaction.deferReply({ flags: 64 });
        } catch (error) {
            console.log('❌ Error deferring reply:', error.message);
            return;
        }
        
        let query = interaction.options.getString('query', true);
        const channel = interaction.member.voice.channel;
        const player = client.player;
        
        console.log(chalk.blue(`🎵 Discord Player play request: ${query}`));
        
        // Check if it's a Spotify URL and handle appropriately
        if (SpotifyService.isSpotifyUrl(query)) {
            const parsed = SpotifyService.parseSpotifyUrl(query);
            if (parsed && (parsed.type === 'playlist' || parsed.type === 'album' || parsed.type === 'artist')) {
                // Handle playlists, albums, and artists with multiple songs
                return await this.handleSpotifyUrl(interaction, player, query, channel);
            } else {
                // Handle single tracks with simple conversion
                const spotifyQuery = await this.convertSpotifyToSearch(query);
                if (spotifyQuery) {
                    query = spotifyQuery;
                    console.log(chalk.green('🎵 Converted Spotify URL to search:', query));
                }
            }
        }
        
        try {
            console.log(chalk.blue('🎵 Attempting Discord Player play...'));
            console.log(chalk.cyan('Query:', query));
            console.log(chalk.cyan('Voice channel:', channel.name));
            console.log(chalk.cyan('Text channel:', interaction.channel.name));
            
            // Check if there's already a queue for this guild
            const existingQueue = player.nodes.get(interaction.guild);
            
            if (!existingQueue) {
                // Create new queue
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 30000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 30000
                });

                // Connect to voice channel
                await queue.connect(channel);
            }

            // Search for the track
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: 'youtube'
            });

            if (!searchResult.hasTracks()) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ No Results Found')
                    .setDescription('No tracks found for your search. Try a different search term.')
                    .addFields(
                        { name: '🔍 Search Query', value: `\`${query}\``, inline: false }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
                return;
            }

            // Add track to queue
            const track = searchResult.tracks[0];
            const queue = player.nodes.get(interaction.guild);
            
            if (queue.isPlaying()) {
                queue.addTrack(track);
                const embed = new EmbedBuilder()
                    .setColor('#00ff41')
                    .setTitle('🎵 Added to Queue')
                    .setDescription(`**${track.title}**`)
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: 'Duration', value: track.duration, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true },
                        { name: 'Position', value: `${queue.tracks.size}`, inline: true }
                    )
                    .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
            } else {
                queue.addTrack(track);
                await queue.node.play();
                
                const embed = new EmbedBuilder()
                    .setColor('#00ff41')
                    .setTitle('🎶 Let\'s get this party started!')
                    .setDescription(`**${track.title}**`)
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: 'Duration', value: track.duration, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true },
                        { name: 'Status', value: 'Now Playing', inline: true }
                    )
                    .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
            }
            
            console.log(chalk.green('✅ Discord Player play completed'));

        } catch (error) {
            console.error('Discord Player play error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            // Handle specific error types
            let errorMessage = 'Could not play the requested song. Please try again.';
            let showErrorDetails = true;
            
            if (error.message && (
                error.message.includes('Could not parse decipher function') ||
                error.message.includes('Could not parse n transform function') ||
                error.message.includes('Unknown error')
            )) {
                errorMessage = 'YouTube is having temporary issues. Please try again in a few moments.';
                showErrorDetails = false;
            } else if (error.message && error.message.includes('Video unavailable')) {
                errorMessage = 'This video is unavailable (private, deleted, or region-restricted).';
                showErrorDetails = false;
            } else if (error.message && error.message.includes('No video found')) {
                errorMessage = 'No video found for your search. Try a different search term.';
                showErrorDetails = false;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playback Error')
                .setDescription(errorMessage)
                .addFields(
                    { name: '🔍 Search Query', value: `\`${query}\``, inline: false }
                );
            
            if (showErrorDetails) {
                embed.addFields(
                    { name: '💡 Error', value: error.message || 'Unknown error', inline: false }
                );
            }
            
            embed.setTimestamp();

            try {
                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
            } catch (replyError) {
                console.error('Failed to send error message:', replyError.message);
            }
        }
    },

    async convertSpotifyToSearch(url) {
        if (!SpotifyService.isAuthenticated) {
            return null;
        }

        const parsed = SpotifyService.parseSpotifyUrl(url);
        if (!parsed) {
            return null;
        }

        try {
            if (parsed.type === 'track') {
                const track = await SpotifyService.getTrack(parsed.id);
                return track ? track.searchQuery : null;
            } else if (parsed.type === 'album') {
                const album = await SpotifyService.getAlbum(parsed.id);
                return album && album.tracks.length > 0 ? album.tracks[0].searchQuery : null;
            } else if (parsed.type === 'playlist') {
                const playlist = await SpotifyService.getPlaylist(parsed.id);
                return playlist && playlist.tracks.length > 0 ? playlist.tracks[0].searchQuery : null;
            } else if (parsed.type === 'artist') {
                // For artists, convert to search for their top track
                const topTracks = await SpotifyService.getArtistTopTracks(parsed.id, 1);
                return topTracks.length > 0 ? topTracks[0].searchQuery : null;
            }
        } catch (error) {
            console.log('Spotify conversion error:', error.message);
            return null;
        }
        
        return null;
    },

    async handleSpotifyUrl(interaction, player, url, channel) {
        if (!SpotifyService.isAuthenticated) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Spotify Not Available')
                .setDescription('Spotify integration is not configured.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            autoDeleteResponse(interaction);
            return;
        }

        const parsed = SpotifyService.parseSpotifyUrl(url);
        if (!parsed) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Spotify URL')
                .setDescription('Could not parse the Spotify URL.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            autoDeleteResponse(interaction);
            return;
        }

        try {
            let searchQueries = [];
            let embedTitle = '';
            let embedDescription = '';
            
            if (parsed.type === 'track') {
                const track = await SpotifyService.getTrack(parsed.id);
                if (track) {
                    searchQueries = [track.searchQuery];
                    embedTitle = '🎵 Playing Spotify Song';
                    embedDescription = `**${track.name}** by ${track.artists.join(', ')}`;
                }
            } else if (parsed.type === 'album') {
                const album = await SpotifyService.getAlbum(parsed.id);
                if (album) {
                    searchQueries = album.tracks.map(track => track.searchQuery);
                    embedTitle = '💿 Playing Spotify Album';
                    embedDescription = `**${album.name}** by ${album.artists.join(', ')}\\n${album.totalTracks} songs`;
                }
            } else if (parsed.type === 'playlist') {
                const playlist = await SpotifyService.getPlaylist(parsed.id);
                if (playlist) {
                    searchQueries = playlist.tracks.map(track => track.searchQuery);
                    embedTitle = '📋 Playing Spotify Playlist';
                    embedDescription = `**${playlist.name}** by ${playlist.owner}\\n${playlist.totalTracks} songs`;
                }
            } else if (parsed.type === 'artist') {
                const artist = await SpotifyService.getArtist(parsed.id);
                const topTracks = await SpotifyService.getArtistTopTracks(parsed.id, 50);
                if (artist && topTracks.length > 0) {
                    searchQueries = topTracks.map(track => track.searchQuery);
                    embedTitle = '🎤 Playing Artist Top Songs';
                    embedDescription = `**${artist.name}**\\n${topTracks.length} top songs`;
                }
            }

            if (searchQueries.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Could not fetch data from Spotify.')
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
                return;
            }

            // Play the tracks using Discord Player
            if (searchQueries.length === 1) {
                const searchResult = await player.search(searchQueries[0], {
                    requestedBy: interaction.user,
                    searchEngine: 'youtube'
                });

                if (!searchResult.hasTracks()) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ No Results Found')
                        .setDescription('Could not find the Spotify track on YouTube.')
                        .setTimestamp();
                    
                    await interaction.editReply({ embeds: [embed] });
                    autoDeleteResponse(interaction);
                    return;
                }

                const track = searchResult.tracks[0];
                const existingQueue = player.nodes.get(interaction.guild);
                
                if (!existingQueue) {
                    const queue = player.nodes.create(interaction.guild, {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild.members.me,
                            requestedBy: interaction.user
                        },
                        selfDeaf: true,
                        volume: 80,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 30000,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 30000
                    });

                    await queue.connect(channel);
                    queue.addTrack(track);
                    await queue.node.play();
                } else {
                    queue.addTrack(track);
                    if (!queue.isPlaying()) {
                        await queue.node.play();
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor('#1db954')
                    .setTitle(embedTitle)
                    .setDescription(embedDescription)
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: 'Duration', value: track.duration, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true }
                    )
                    .setFooter({ text: 'Powered by Spotify' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                autoDeleteResponse(interaction);
            } else {
                // Handle multiple tracks
                const embed = new EmbedBuilder()
                    .setColor('#1db954')
                    .setTitle(embedTitle)
                    .setDescription(embedDescription)
                    .addFields(
                        { name: '⏳ Status', value: 'Adding songs to the queue...', inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true }
                    )
                    .setFooter({ text: 'Powered by Spotify' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                
                // Add tracks to queue
                let addedCount = 0;
                let failedCount = 0;
                
                for (const searchQuery of searchQueries) {
                    try {
                        const searchResult = await player.search(searchQuery, {
                            requestedBy: interaction.user,
                            searchEngine: 'youtube'
                        });

                        if (searchResult.hasTracks()) {
                            const track = searchResult.tracks[0];
                            const queue = player.nodes.get(interaction.guild);
                            
                            if (!queue) {
                                const newQueue = player.nodes.create(interaction.guild, {
                                    metadata: {
                                        channel: interaction.channel,
                                        client: interaction.guild.members.me,
                                        requestedBy: interaction.user
                                    },
                                    selfDeaf: true,
                                    volume: 80,
                                    leaveOnEmpty: true,
                                    leaveOnEmptyCooldown: 30000,
                                    leaveOnEnd: true,
                                    leaveOnEndCooldown: 30000
                                });

                                await newQueue.connect(channel);
                                newQueue.addTrack(track);
                                if (addedCount === 0) {
                                    await newQueue.node.play();
                                }
                            } else {
                                queue.addTrack(track);
                                if (!queue.isPlaying() && addedCount === 0) {
                                    await queue.node.play();
                                }
                            }
                            
                            addedCount++;
                        } else {
                            failedCount++;
                        }
                    } catch (error) {
                        console.log(`Failed to add: ${searchQuery} - ${error.message}`);
                        failedCount++;
                    }
                }
                
                const finalEmbed = new EmbedBuilder()
                    .setColor('#1db954')
                    .setTitle(embedTitle)
                    .setDescription(embedDescription)
                    .addFields(
                        { name: '✅ Added', value: `${addedCount} songs`, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true }
                    )
                    .setFooter({ text: 'Powered by Spotify' })
                    .setTimestamp();

                if (failedCount > 0) {
                    finalEmbed.addFields({ name: '⚠️ Failed', value: `${failedCount} songs`, inline: true });
                }

                await interaction.editReply({ embeds: [finalEmbed] });
                autoDeleteResponse(interaction);
            }

        } catch (error) {
            console.error('Spotify Discord Player error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playback Error')
                .setDescription('Could not play the Spotify content.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            autoDeleteResponse(interaction);
        }
    }
};