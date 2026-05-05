import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const commands: object[] = [];
const slashDir = path.join(__dirname, 'commands', 'slash');

if (fs.existsSync(slashDir)) {
  for (const file of fs.readdirSync(slashDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
    const cmd = require(path.join(slashDir, file));
    commands.push(cmd.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  console.log(`Deploying ${commands.length} slash commands...`);
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), {
    body: commands,
  });
  console.log('Done.');
})();
