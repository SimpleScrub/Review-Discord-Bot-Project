import { Interaction, Collection } from 'discord.js';
import { SlashCommand } from '../types';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction: Interaction, slashCommands: Collection<string, SlashCommand>) {
    if (!interaction.isChatInputCommand()) return;

    const command = slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const msg = { content: 'Error executing command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
};
