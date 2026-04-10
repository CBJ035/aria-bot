import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

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
        .setName('help')
        .setDescription('if you really need it...'),
    
    cooldown: 10,
    
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Aria - Command Help')
            .setDescription('I\'m the best - I guess I\'ll help you...')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🎶 Music Commands',
                    value: '`/play` - Play songs, YouTube/Spotify URLs, or playlists\n`/pause` - Pause/resume playback\n`/skip` - Skip current song\n`/stop` - Stop music and clear queue\n`/queue` - Show current queue\n`/nowplaying` - Show current track info',
                    inline: false
                },
                {
                    name: '🔧 Control Commands',
                    value: '`/volume` - Adjust playback volume\n`/loop` - Toggle loop modes\n`/shuffle` - Shuffle the queue\n`/clear` - Clear the queue\n`/remove` - Remove specific tracks',
                    inline: false
                },
                {
                    name: '📊 Bot Info',
                    value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Version:** 3.0.0\n**Uptime:** <t:${Math.floor(client.readyTimestamp / 1000)}:R>`,
                    inline: false
                },
                {
                    name: '🎯 Features',
                    value: '• YouTube & Spotify integration\n• Playlist support (YouTube/Spotify)\n• High-quality audio streaming\n• Smart queue management\n• Loop modes & shuffle\n• Volume control & rich embeds',
                    inline: false
                },
                {
                    name: '💡 Tips',
                    value: '• Use `/play` with song names, YouTube URLs, or Spotify links\n• Supports Spotify playlists, albums, tracks, and artists\n• Artist links play their top 20 tracks\n• Queue automatically plays next songs\n• Use `/queue page:2` for multiple pages\n• Loop modes: Off, Track, Queue',
                    inline: false
                }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        autoDeleteResponse(interaction);
    }
};
