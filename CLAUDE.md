# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start bot with hot-reload (tsx watch)
npm run deploy       # Register slash commands with Discord (run after adding/changing slash commands)
npm run db:migrate   # Apply schema changes and create migration
npm run db:generate  # Regenerate Prisma client after schema change
npm run db:studio    # Open visual DB browser
npm run build        # Compile TypeScript to dist/
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture

The bot uses a file-based loader pattern. On startup, `src/index.ts` scans three directories and registers their exports into `Collection` maps passed to every event handler:

- `src/commands/slash/` — slash commands, each exports `{ data: SlashCommandBuilder, execute }`
- `src/commands/prefix/` — prefix commands, each exports `{ name, aliases?, description, execute }`
- `src/events/` — Discord.js event handlers, each exports `{ name, once?, execute }`

**Adding a slash command:** create a file in `src/commands/slash/`, implement `SlashCommand` from `src/types.ts`, then run `npm run deploy` to register it with Discord.

**Adding a prefix command:** create a file in `src/commands/prefix/`, implement `PrefixCommand` from `src/types.ts`. Default prefix is `!`, overridable via `PREFIX` env var.

**Adding an event:** create a file in `src/events/`. The loader passes `(..discordArgs, slashCommands, prefixCommands)` — event handlers receive both collections as trailing arguments.

## Database

Prisma v7 + SQLite. Schema in `prisma/schema.prisma`, DB URL configured in `prisma.config.ts` (not in the schema file — Prisma v7 moved URL config there). Import the singleton client from `src/lib/prisma.ts`.

After editing `prisma/schema.prisma`, always run `npm run db:migrate` then `npm run db:generate`.

## Environment Variables

Required in `.env`:

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Application ID from Discord Developer Portal |
| `GUILD_ID` | Test server ID (slash commands deploy here) |
| `DATABASE_URL` | SQLite path, default `file:./dev.db` |
| `PREFIX` | Prefix for prefix commands, default `!` |
