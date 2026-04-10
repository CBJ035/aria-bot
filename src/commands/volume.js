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
import VotingService from '../services/VotingService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the music volume (you better turn it up)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)
        ),
    
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

        const volume = interaction.options.getInteger('level');
        const oldVolume = queue.volume;

        // Check if voting is required
        if (VotingService.requiresVoting(interaction, queue)) {
            // Try to add vote to existing vote or start new vote
            const existingVote = await VotingService.addVote(interaction, 'volume');
            if (existingVote) return; // Vote was handled

            // Start new vote
            return await VotingService.startVote(interaction, 'volume', { volume });
        }
        
        try {
            distube.setVolume(interaction.guild, volume);
            
            let volumeEmoji = '🔊';
            if (volume === 0) volumeEmoji = '🔇';
            else if (volume < 30) volumeEmoji = '🔉';
            else if (volume < 70) volumeEmoji = '🔊';
            else volumeEmoji = '📢';
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Volume Changed ${volumeEmoji}`)
                .setDescription(`Volume changed from **${oldVolume}%** to **${volume}%**`)
                .addFields(
                    { name: '🎵 Current song', value: `${queue.songs[0].name}`, inline: true },
                    { name: '👤 Changed by', value: interaction.user.toString(), inline: true }
                )
                .setThumbnail(queue.songs[0].thumbnail)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        } catch (error) {
            console.error('Volume command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to change the volume.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        }
    }
};