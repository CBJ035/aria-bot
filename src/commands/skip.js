import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import VotingService from '../services/VotingService.js';

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
        .setName('skip')
        .setDescription('Skip the current song or multiple songs')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of songs to skip (default: 1)')
                .setMinValue(1)
                .setMaxValue(10)
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

        const amount = interaction.options.getInteger('amount') || 1;
        const currentSong = queue.songs[0];

        // Check if voting is required (temporarily disabled to fix interaction timeout)
        // TODO: Re-enable voting system after fixing interaction handling
        /*
        if (VotingService.requiresVoting(interaction, queue)) {
            // Try to add vote to existing vote or start new vote
            const existingVote = await VotingService.addVote(interaction, 'skip');
            if (existingVote) return; // Vote was handled

            // Start new vote
            return await VotingService.startVote(interaction, 'skip', { amount });
        }
        */
        
        // Validate skip amount
        if (amount > queue.songs.length) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Oh right... totally makes sense...')
                .setDescription(`I can't skip ${amount} songs when there's only ${queue.songs.length} songs in queue...`)
                .addFields(
                    { name: '💡 Tip', value: `Try skipping ${queue.songs.length} or fewer songs`, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
            return;
        }
        
        try {
            const skippedSong = queue.songs[0].name;
            let skippedSongs = [skippedSong];
            
            // If skipping multiple tracks, remove the extra ones from queue first
            if (amount > 1) {
                const tracksToRemove = Math.min(amount - 1, queue.songs.length - 1);
                for (let i = 0; i < tracksToRemove; i++) {
                    if (queue.songs.length > 1) {
                        skippedSongs.push(queue.songs[1].name); // Next song after current
                        queue.songs.splice(1, 1); // Remove from position 1
                    }
                }
            }
            
            // Skip current song (which advances to the next remaining song)
            // If there's only one song left, stop instead of skip
            if (queue.songs.length <= 1) {
                await distube.stop(interaction.guild);
            } else {
                await distube.skip(interaction.guild);
            }
            
            // Determine if music stopped or skipped
            const isStopped = queue.songs.length <= 1;
            const remainingSongs = Math.max(0, queue.songs.length - 1);
            
            const embed = new EmbedBuilder()
                .setColor(isStopped ? '#ff6b6b' : '#00ff00')
                .setTitle(isStopped ? 
                    (amount === 1 ? 'Song Stopped ⏹️' : `${amount} Songs Skipped, Music Stopped ⏹️`) :
                    (amount === 1 ? 'Song Skipped ⏭️' : `${amount} Songs Skipped ⏭️`))
                .setDescription(amount === 1 ? 
                    `${isStopped ? 'Stopped' : 'Skipped'}: **${skippedSong}**` : 
                    `Skipped ${skippedSongs.length} songs:\n${skippedSongs.map((song, i) => `${i + 1}. ${song}`).slice(0, 5).join('\n')}${skippedSongs.length > 5 ? '\n...' : ''}`)
                .setThumbnail(currentSong.thumbnail)
                .addFields(
                    { name: '👤 Skipped by', value: interaction.user.toString(), inline: true },
                    { name: '📊 Queue', value: `${remainingSongs} songs remaining`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
            
        } catch (error) {
            console.error('Skip command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Skip Failed')
                .setDescription('An error occurred while trying to skip songs.')
                .addFields(
                    { name: '💡 Error', value: error.message || 'Unknown error', inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            autoDeleteResponse(interaction);
        }
    }
};