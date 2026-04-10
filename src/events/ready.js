import chalk from 'chalk';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log('');
        console.log(chalk.green('🎉 Bot is ready!'));
        console.log(chalk.cyan(`👤 Logged in as: ${client.user.tag}`));
        console.log(chalk.cyan(`🏠 Serving ${client.guilds.cache.size} servers`));
        console.log(chalk.cyan(`👥 Watching ${client.users.cache.size} users`));
        console.log('');

        // Set bot activity
        await client.user.setPresence({
            activities: [{
                name: 'music | /play',
                type: 2 // LISTENING
            }],
            status: 'online'
        });

        console.log(chalk.green('✅ Bot is now online and ready to play music!'));
        console.log(chalk.blue('🎵 Use /play to add songs to the queue'));
        console.log('');
    }
};
