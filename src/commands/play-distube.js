import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import SpotifyService from '../services/SpotifyService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add it to the queue')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, YouTube/Spotify URL, or playlist to play')
                .setRequired(true)
        ),
    
    cooldown: 3,
    
    async execute(interaction, client) {
        // Check if interaction is still valid
        if (!interaction.isRepliable()) {
            console.log('❌ Interaction is no longer repliable');
            return;
        }

        await interaction.deferReply({ flags: 64 });
        
        const query = interaction.options.getString('query', true);
        const channel = interaction.member.voice.channel;
        const distube = client.distube;
        
        console.log(chalk.blue(`🎵 DisTube play request: ${query}`));
        
        // Check if it's a Spotify URL and handle it specially
        if (SpotifyService.isSpotifyUrl(query)) {
            return await this.handleSpotifyUrl(interaction, distube, query, channel);
        }
        
        try {
            // Use DisTube to play the song
            const song = await distube.play(channel, query, {
                textChannel: interaction.channel,
                member: interaction.member
            });
            
            console.log(chalk.green('✅ DisTube play successful:', song.name));
            
            const embed = new EmbedBuilder()
                .setColor('#00ff41')
                .setTitle('🎶 Now Playing')
                .setDescription(`**${song.name}**`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: 'Duration', value: song.formattedDuration, inline: true },
                    { name: 'Requested by', value: interaction.user.toString(), inline: true },
                    { name: 'Volume', value: `${distube.getQueue(interaction.guild)?.volume || 50}%`, inline: true }
                )
                .setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('DisTube play error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playback Error')
                .setDescription('Could not play the requested song. Please try again.')
                .addFields(
                    { name: '🔍 Search Query', value: `\`${query}\``, inline: false },
                    { name: '💡 Error', value: error.message, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleSpotifyUrl(interaction, distube, url, channel) {
        if (!SpotifyService.isAuthenticated) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Spotify Not Available')
                .setDescription('Spotify integration is not configured.')
                .setTimestamp();
            
            return interaction.editReply({ embeds: [embed] });
        }

        const parsed = SpotifyService.parseSpotifyUrl(url);
        if (!parsed) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Spotify URL')
                .setDescription('Could not parse the Spotify URL.')
                .setTimestamp();
            
            return interaction.editReply({ embeds: [embed] });
        }

        try {
            let searchQueries = [];
            let embedTitle = '';
            let embedDescription = '';
            
            if (parsed.type === 'track') {
                const track = await SpotifyService.getTrack(parsed.id);
                if (track) {
                    searchQueries = [track.searchQuery];
                    embedTitle = '🎵 Playing Spotify Track';
                    embedDescription = `**${track.name}** by ${track.artists.join(', ')}`;
                }
            } else if (parsed.type === 'album') {
                const album = await SpotifyService.getAlbum(parsed.id);
                if (album) {
                    searchQueries = album.tracks.slice(0, 20).map(track => track.searchQuery);
                    embedTitle = '💿 Playing Spotify Album';
                    embedDescription = `**${album.name}** by ${album.artists.join(', ')}\\n${Math.min(album.totalTracks, 20)} tracks`;
                }
            } else if (parsed.type === 'playlist') {
                const playlist = await SpotifyService.getPlaylist(parsed.id);
                if (playlist) {
                    searchQueries = playlist.tracks.slice(0, 20).map(track => track.searchQuery);
                    embedTitle = '📋 Playing Spotify Playlist';
                    embedDescription = `**${playlist.name}** by ${playlist.owner}\\n${Math.min(playlist.totalTracks, 20)} tracks`;
                }
            }

            if (searchQueries.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('Could not fetch data from Spotify.')
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }

            // Play the tracks using DisTube
            if (searchQueries.length === 1) {
                const song = await distube.play(channel, searchQueries[0], {
                    textChannel: interaction.channel,
                    member: interaction.member
                });

                const embed = new EmbedBuilder()
                    .setColor('#1db954')
                    .setTitle(embedTitle)
                    .setDescription(embedDescription)
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        { name: 'Duration', value: song.formattedDuration, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true }
                    )
                    .setFooter({ text: 'Powered by Spotify' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Add multiple tracks
                let addedCount = 0;
                
                for (const searchQuery of searchQueries) {
                    try {
                        await distube.play(channel, searchQuery, {
                            textChannel: interaction.channel,
                            member: interaction.member
                        });
                        addedCount++;
                    } catch (error) {
                        console.log(`Failed to add: ${searchQuery}`);
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor('#1db954')
                    .setTitle(embedTitle)
                    .setDescription(embedDescription)
                    .addFields(
                        { name: '✅ Added', value: `${addedCount} tracks`, inline: true },
                        { name: 'Requested by', value: interaction.user.toString(), inline: true }
                    )
                    .setFooter({ text: 'Powered by Spotify' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Spotify DisTube error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Playback Error')
                .setDescription('Could not play the Spotify content.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
