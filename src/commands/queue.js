import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setMinValue(1)
        ),
    
    cooldown: 5,
    
    async execute(interaction, client) {
        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue || queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('📭 Empty Queue')
                .setDescription('There are no songs in the queue. Use `/play` to add some music!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const page = interaction.options.getInteger('page') || 1;
        const tracksPerPage = 10;
        const songs = queue.songs.slice(1); // Exclude currently playing song
        const totalPages = Math.ceil(songs.length / tracksPerPage) || 1;
        
        if (page > totalPages) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Page')
                .setDescription(`Page ${page} doesn't exist... There are only ${totalPages} pages 🙄`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const startIdx = (page - 1) * tracksPerPage;
        const endIdx = startIdx + tracksPerPage;
        const pageEntries = songs.slice(startIdx, endIdx);

        let queueString = '';
        
        // Add current track
        const current = queue.songs[0];
        queueString += `**🎶 I am playing:**\n\`${current.name}\` - ${current.user?.toString() || 'Unknown'} [${current.formattedDuration}]\n\n`;
        
        if (pageEntries.length > 0) {
            queueString += '**📋 Up Next:**\n';
            pageEntries.forEach((song, index) => {
                const position = startIdx + index + 1;
                queueString += `\`${position}.\` [${song.name}](${song.url}) - ${song.user?.toString() || 'Unknown'} [${song.formattedDuration}]\n`;
            });
        } else if (songs.length === 0) {
            queueString += '**📭 Queue is empty**\nAdd more songs requests with `/play`!';
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`🎵 Music Queue - ${interaction.guild.name}`)
            .setDescription(queueString)
            .addFields(
                { name: '📊 Queue Stats', value: `**Total Songs:** ${queue.songs.length}\n**Duration:** ${queue.formattedDuration}\n**Volume:** ${queue.volume}%`, inline: true },
                { name: '🔄 Loop Mode', value: queue.repeatMode ? (queue.repeatMode === 1 ? 'Song' : 'Queue') : 'Off', inline: true },
                { name: '📄 Pages', value: `${page}/${totalPages}`, inline: true }
            )
            .setThumbnail(current.thumbnail)
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};