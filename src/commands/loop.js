import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue, QueueRepeatMode } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop mode')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        ),
    
    cooldown: 3,
    
    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        
        if (!queue || !queue.currentTrack) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Nothing Playing... 🔇')
                .setDescription('There is no music playing dude... Are you delulu?')
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const mode = interaction.options.getString('mode');
        let newMode;
        let modeText;
        let emoji;

        if (mode) {
            switch (mode) {
                case 'off':
                    newMode = QueueRepeatMode.OFF;
                    modeText = 'Off';
                    emoji = '❌';
                    break;
                case 'track':
                    newMode = QueueRepeatMode.TRACK;
                    modeText = 'Track';
                    emoji = '🔂';
                    break;
                case 'queue':
                    newMode = QueueRepeatMode.QUEUE;
                    modeText = 'Queue';
                    emoji = '🔁';
                    break;
            }
        } else {
            // Cycle through modes
            switch (queue.repeatMode) {
                case QueueRepeatMode.OFF:
                    newMode = QueueRepeatMode.TRACK;
                    modeText = 'Track';
                    emoji = '🔂';
                    break;
                case QueueRepeatMode.TRACK:
                    newMode = QueueRepeatMode.QUEUE;
                    modeText = 'Queue';
                    emoji = '🔁';
                    break;
                case QueueRepeatMode.QUEUE:
                    newMode = QueueRepeatMode.OFF;
                    modeText = 'Off';
                    emoji = '❌';
                    break;
                default:
                    newMode = QueueRepeatMode.TRACK;
                    modeText = 'Track';
                    emoji = '🔂';
            }
        }

        try {
            queue.setRepeatMode(newMode);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${emoji} Loop Mode Changed`)
                .setDescription(`Loop mode set to: **${modeText}**`)
                .addFields(
                    { name: '🎵 Current Song', value: `${queue.currentTrack.title}`, inline: true },
                    { name: '👤 Changed by', value: interaction.user.toString(), inline: true }
                )
                .setThumbnail(queue.currentTrack.thumbnail)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Loop command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while trying to change the loop mode.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
