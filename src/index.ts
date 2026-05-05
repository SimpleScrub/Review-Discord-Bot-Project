import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { SlashCommand, PrefixCommand } from './types';
import fs from 'fs';
import path from 'path';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const slashCommands = new Collection<string, SlashCommand>();
const prefixCommands = new Collection<string, PrefixCommand>();

// Load slash commands
const slashDir = path.join(__dirname, 'commands', 'slash');
if (fs.existsSync(slashDir)) {
  for (const file of fs.readdirSync(slashDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
    const cmd: SlashCommand = require(path.join(slashDir, file));
    slashCommands.set(cmd.data.name, cmd);
  }
}

// Load prefix commands
const prefixDir = path.join(__dirname, 'commands', 'prefix');
if (fs.existsSync(prefixDir)) {
  for (const file of fs.readdirSync(prefixDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
    const cmd: PrefixCommand = require(path.join(prefixDir, file));
    prefixCommands.set(cmd.name, cmd);
    if (cmd.aliases) cmd.aliases.forEach((alias) => prefixCommands.set(alias, cmd));
  }
}

// Load events
const eventsDir = path.join(__dirname, 'events');
if (fs.existsSync(eventsDir)) {
  for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
    const event = require(path.join(eventsDir, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, slashCommands, prefixCommands));
    } else {
      client.on(event.name, (...args) => event.execute(...args, slashCommands, prefixCommands));
    }
  }
}

client.login(process.env.DISCORD_TOKEN);
