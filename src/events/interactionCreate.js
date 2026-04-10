import { EmbedBuilder, Collection } from 'discord.js';
import chalk from 'chalk';

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.log(chalk.yellow(`⚠️  Unknown command: ${interaction.commandName}`));
            return;
        }

        // Check if user is in a voice channel for music commands
        const musicCommands = ['play', 'skip', 'stop', 'pause', 'resume', 'queue', 'nowplaying', 'volume', 'shuffle', 'loop', 'clear', 'remove'];
        if (musicCommands.includes(interaction.commandName)) {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Voice Channel Required')
                    .setDescription('You need to be in a voice channel to use music commands!')
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: 64 });
            }
        }

        // Cooldown system
        const { cooldowns } = client;
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                const embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('⏳ Command Cooldown')
                    .setDescription(`Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: 64 });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            console.log(chalk.blue(`🎵 ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild.name}`));
            await command.execute(interaction, client);
        } catch (error) {
            console.log(chalk.red(`❌ Error executing ${interaction.commandName}:`, error.message || error));
            
            // Handle specific Discord API errors
            if (error.code === 10062) {
                console.log(chalk.yellow('⚠️ Unknown interaction - interaction may have expired'));
                return;
            }
            
            if (error.code === 40060) {
                console.log(chalk.yellow('⚠️ Interaction already acknowledged'));
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Command Error')
                .setDescription('There was an error while executing this command!')
                .setTimestamp();

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [embed], flags: 64 });
                } else {
                    await interaction.reply({ embeds: [embed], flags: 64 });
                }
            } catch (replyError) {
                console.log(chalk.red('❌ Failed to send error message:', replyError.message));
            }
        }
    }
};
