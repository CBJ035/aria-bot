import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import AutoDisconnectService from '../services/AutoDisconnectService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('test-disconnect')
        .setDescription('Test the auto-disconnect system (admin only)'),
    
    cooldown: 10,
    
    async execute(interaction, client) {
        // Check if user is admin/owner
        if (interaction.user.id !== '296311574249865216') {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Permission Denied')
                .setDescription('This command is for administrators only.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const distube = client.distube;
        const queue = distube.getQueue(interaction.guild);
        
        if (!queue) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ No Queue')
                .setDescription('No music queue found to test.')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // Force a disconnect check
        console.log('🧪 Manual disconnect test triggered');
        await AutoDisconnectService.checkGuild(interaction.guild.id, distube);
        
        const status = AutoDisconnectService.getStatus(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🧪 Auto-Disconnect Test')
            .setDescription('Manually triggered disconnect check.')
            .addFields(
                { name: '📊 Monitoring Status', value: status ? 'Active' : 'Inactive', inline: true },
                { name: '⏰ Time Since Activity', value: status ? `${status.timeSinceActivity}s` : 'N/A', inline: true },
                { name: '🔍 Queue ID', value: queue.id, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
