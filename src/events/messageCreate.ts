import { Message, Collection, Client } from 'discord.js';
import { PrefixCommand } from '../types';

const PREFIX = process.env.PREFIX ?? '!';

module.exports = {
  name: 'messageCreate',
  async execute(
    message: Message,
    _slashCommands: unknown,
    prefixCommands: Collection<string, PrefixCommand>
  ) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, message.client as Client);
    } catch (error) {
      console.error(error);
      await message.reply('Error executing command.');
    }
  },
};
