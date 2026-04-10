import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import VotingService from '../services/VotingService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue'),
    
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

        if (queue.songs.length < 3) { // Current song + at least 2 in queue
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('Are you Einstein?')
                .setDescription('You need at least 2 songs in the queue to shuffle!')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // Check if voting is required
        if (VotingService.requiresVoting(interaction, queue)) {
            // Try to add vote to existing vote or start new vote
            const existingVote = await VotingService.addVote(interaction, 'shuffle');
            if (existingVote) return; // Vote was handled

            // Start new vote
            return await VotingService.startVote(interaction, 'shuffle');
        }

        try {
            await distube.shuffle(interaction.guild);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Queue Shuffled 🔀')
                .setDescription(`Shuffled **${queue.songs.length - 1}** songs in the queue!`)
                .addFields(
                    { name: '🎵 Current Song', value: `${queue.songs[0].name} continues playing`, inline: false },
                    { name: '👤 Shuffled by', value: interaction.user.toString(), inline: true },
                    { name: '📊 Queue Size', value: `${queue.songs.length} songs`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Shuffle command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to shuffle the queue.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
        }
    }
};