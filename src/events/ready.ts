import { Client, ActivityType } from 'discord.js';

module.exports = {
  name: 'ready',
  once: true,
  execute(client: Client) {
    console.log(`Logged in as ${client.user?.tag}`);
    client.user?.setActivity('reviews', { type: ActivityType.Watching });
  },
};
