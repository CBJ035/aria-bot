import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import VotingService from '../services/VotingService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a specific song from the queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position of the song to remove (1 = next song)')
                .setMinValue(1)
                .setRequired(true)
        ),
    
    cooldown: 3,
    
    async execute(interaction, client) {
        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue || queue.songs.length <= 1) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Empty queue... 🫥')
                .setDescription('There are no songs in the queue to remove...')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const position = interaction.options.getInteger('position');
        const queueLength = queue.songs.length - 1; // Exclude currently playing song
        
        if (position > queueLength) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('What are you talking about?')
                .setDescription(`Song number ${position} doesn't exist bro... The queue only has ${queueLength} songs.`)
                .addFields(
                    { name: '💡 Tip', value: 'Use `/queue` to see songs positions', inline: false }
                )
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // Check if voting is required
        if (VotingService.requiresVoting(interaction, queue)) {
            // Try to add vote to existing vote or start new vote
            const existingVote = await VotingService.addVote(interaction, 'remove');
            if (existingVote) return; // Vote was handled

            // Start new vote
            return await VotingService.startVote(interaction, 'remove', { position });
        }

        try {
            // Get the song to be removed (position + 1 because index 0 is current song)
            const songToRemove = queue.songs[position];
            
            if (!songToRemove) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Which song?')
                    .setDescription(`Dude there's no song at position ${position}.`)
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed], flags: 64 });
            }
            
            // Remove the song from queue
            queue.songs.splice(position, 1);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Song Removed 🗑️')
                .setDescription(`Removed: **${songToRemove.name}**`)
                .setThumbnail(songToRemove.thumbnail)
                .addFields(
                    { name: '📍 Position', value: `${position}`, inline: true },
                    { name: '⏱️ Duration', value: songToRemove.formattedDuration, inline: true },
                    { name: '👤 Removed by', value: interaction.user.toString(), inline: true },
                    { name: '📊 Queue Status', value: `${queue.songs.length - 1} songs remaining`, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            
        } catch (error) {
            console.error('Remove command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to remove the song.')
                .addFields(
                    { name: '💡 Try Again', value: 'Use `/queue` to check current positions', inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        }
    }
};
