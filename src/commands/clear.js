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
        .setName('clear')
        .setDescription('Clear the music queue'),
    
    cooldown: 3,
    
    async execute(interaction, client) {
        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue || !queue.songs || queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nothing playing... 🔇')
                .setDescription('There is no music playing dude...')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
            return;
        }

        if (queue.songs.length <= 1) {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('Already empty 🫥')
                .setDescription('Fr dude? You can see that it\'s clearly empty...')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
            return;
        }

        try {
            const clearedCount = queue.songs.length - 1; // Exclude current song
            const currentSong = queue.songs[0];
            
            // Clear all songs except the currently playing one
            queue.songs.splice(1);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Queue cleared 🗑️')
                .setDescription(`Cleared **${clearedCount}** songs from the queue. What a bummer...`)
                .addFields(
                    { name: '🎵 Current Song', value: `${currentSong.name} will continue playing`, inline: false },
                    { name: '👤 Cleared by', value: interaction.user.toString(), inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        } catch (error) {
            console.error('Clear command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to clear the queue.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        }
    }
};
