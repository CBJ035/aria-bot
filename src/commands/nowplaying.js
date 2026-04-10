import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing song')
        .addBooleanOption(option =>
            option.setName('detailed')
                .setDescription('Show detailed information')
        ),
    
    cooldown: 5,
    
    async execute(interaction, client) {
        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue || !queue.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nothing Playing... 🔇')
                .setDescription('There is no music playing dude... Are you delulu?')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const song = queue.songs[0];
        const detailed = interaction.options.getBoolean('detailed') || false;
        
        // Calculate smooth real-time progress with compact bar
        const currentTime = queue.currentTime;
        const duration = song.duration;
        const totalSegments = 30; // More segments for smoother movement, compact display
        const progress = Math.max(0, Math.min(totalSegments, Math.floor((currentTime / duration) * totalSegments)));
        const progressBar = '─'.repeat(progress) + '●' + '─'.repeat(totalSegments - progress);
        
        const timeFormat = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        const progressText = `${progressBar} ${timeFormat(currentTime)} / ${song.formattedDuration}`;

        const embed = new EmbedBuilder()
            .setColor('#00ff41')
            .setTitle('🎵 Oh me? I\'m listening to')
            .setDescription(`**${song.name}**`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: 'Duration', value: song.formattedDuration, inline: true },
                { name: 'Requested by', value: song.user?.toString() || 'Unknown', inline: true },
                { name: 'Volume', value: `${queue.volume}%`, inline: true },
                { name: 'Progress', value: progressText, inline: false }
            );

        if (detailed) {
            embed.addFields(
                { name: 'Source', value: 'YouTube', inline: true },
                { name: 'Views', value: song.views ? song.views.toLocaleString() : 'N/A', inline: true },
                { name: 'Uploader', value: song.uploader?.name || 'N/A', inline: true },
                { name: 'Loop Mode', value: queue.repeatMode ? (queue.repeatMode === 1 ? 'Song' : 'Queue') : 'Off', inline: true },
                { name: 'Queue Size', value: `${queue.songs.length} songs`, inline: true },
                { name: 'Paused', value: queue.paused ? 'Yes' : 'No', inline: true }
            );
        }

        embed.setFooter({ text: `Today at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })
        .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};