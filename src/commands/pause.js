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
        .setName('pause')
        .setDescription('Do I need to explain this?'),
    
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

        try {
            if (queue.paused) {
                distube.resume(interaction.guild);
                
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Thank you... 🙄')
                    .setDescription(`Resumed: **${queue.songs[0].name}**`)
                    .setThumbnail(queue.songs[0].thumbnail)
                    .addFields(
                        { name: '👤 Resumed by', value: interaction.user.toString(), inline: true }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], flags: 64 });
                autoDeleteResponse(interaction);
            } else {
                distube.pause(interaction.guild);
                
                const embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('Wtf!? Why did you pause?')
                    .setDescription(`Paused: **${queue.songs[0].name}**`)
                    .setThumbnail(queue.songs[0].thumbnail)
                    .addFields(
                        { name: '👤 Paused by', value: interaction.user.toString(), inline: true },
                        { name: '💡 Tip', value: 'Use `/pause` again to resume', inline: true }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], flags: 64 });
                autoDeleteResponse(interaction);
            }
        } catch (error) {
            console.error('Pause command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to pause/resume the music.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        }
    }
};