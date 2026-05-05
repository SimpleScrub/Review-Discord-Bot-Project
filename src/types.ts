import { SlashCommandBuilder, ChatInputCommandInteraction, Message, Client } from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface PrefixCommand {
  name: string;
  aliases?: string[];
  description: string;
  execute: (message: Message, args: string[], client: Client) => Promise<void>;
}
