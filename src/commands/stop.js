import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import VotingService from '../services/VotingService.js';
import AutoDisconnectService from '../services/AutoDisconnectService.js';

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
        .setName('stop')
        .setDescription('Stop the music and clear the queue like a party pooper'),
    
    cooldown: 3,
    
    async execute(interaction, client) {
        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue || !queue.playing) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nothing Playing... 🔇')
                .setDescription('There is no music playing dude... Are you delulu?')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
            return;
        }

        // Check if voting is required
        if (VotingService.requiresVoting(interaction, queue)) {
            // Try to add vote to existing vote or start new vote
            const existingVote = await VotingService.addVote(interaction, 'stop');
            if (existingVote) return; // Vote was handled

            // Start new vote
            return await VotingService.startVote(interaction, 'stop');
        }

        try {
            distube.stop(interaction.guild);
            
            // Stop auto-disconnect monitoring since we're manually stopping
            AutoDisconnectService.manualDisconnect(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Wtf? Why did you stop?')
                .setDescription('What a way to kill the whole party... all music stopped and the queue cleared.')
                .addFields(
                    { name: 'Party pooper:', value: interaction.user.toString(), inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        } catch (error) {
            console.error('Stop command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to stop the music.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        }
    }
};