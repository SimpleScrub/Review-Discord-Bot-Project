# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from repo root (bot):
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

Run from `api/` (Express API):
```bash
npm run dev          # Start API with hot-reload (tsx watch)
npm run build        # Compile to dist/
```

Run from `client/` (React Discord Activity):
```bash
npm run dev          # Vite dev server
npm run build        # tsc + vite build
npm run lint         # ESLint
```

Full dev setup requires three processes: bot (`npm run dev`), API (`cd api && npm run dev`), and client (`cd client && npm run dev`).

## Architecture

Three packages in a monorepo — not using npm workspaces, each has its own `node_modules`.

### Bot (`src/`)

File-based loader pattern. On startup, `src/index.ts` scans three directories and registers their exports into `Collection` maps passed to every event handler:

- `src/commands/slash/` — slash commands, each exports `{ data: SlashCommandBuilder, execute }`
- `src/commands/prefix/` — prefix commands, each exports `{ name, aliases?, description, execute }`
- `src/events/` — Discord.js event handlers, each exports `{ name, once?, execute }`

**Adding a slash command:** create a file in `src/commands/slash/`, implement `SlashCommand` from `src/types.ts`, then run `npm run deploy` to register it with Discord.

**Adding a prefix command:** create a file in `src/commands/prefix/`, implement `PrefixCommand` from `src/types.ts`. Default prefix is `!`, overridable via `PREFIX` env var.

**Adding an event:** create a file in `src/events/`. The loader passes `(...discordArgs, slashCommands, prefixCommands)` — event handlers receive both collections as trailing arguments.

### API (`api/`)

Express server on `API_PORT` (default 3001). Two route files:

- `api/src/routes/reviews.ts` — paginated list with category/authorId/search filters, single fetch, distinct categories. Queries are **not** guild-scoped (unlike bot queries).
- `api/src/routes/auth.ts` — Discord OAuth2 code → access_token exchange for the Embedded App SDK.

The API creates its own PrismaClient instance (not the bot singleton).

### Client (`client/`)

React + Tailwind + `@discord/embedded-app-sdk`. Runs as a Discord Embedded Activity.

- `client/src/lib/discord.ts` — initializes Discord SDK, runs OAuth2 flow: `authorize()` → exchange code at `/api/auth/token` → `authenticate()`
- `client/src/hooks/useReviews.ts` — fetches paginated reviews from `/api/reviews`

## Database

Prisma v7 + SQLite. Schema in `prisma/schema.prisma`, DB URL configured in `prisma.config.ts` (not in the schema file — Prisma v7 moved URL config there). Import the singleton client from `src/lib/prisma.ts`.

After editing `prisma/schema.prisma`, always run `npm run db:migrate` then `npm run db:generate`.

**Review model fields:**
- `subject` (String) — what's being reviewed
- `category` (String) — one of: `Movies`, `Music`, `Food`, `Experience`, `Game`, `Book`, `Other`
- `rating` (String) — free-form (e.g. `"8/10"`, `"S+"`, `"50/10"`); no validation enforced
- `imageUrl` (String?) — Discord CDN URL after re-upload
- `comments` (String?)
- `authorId` (String) — Discord user ID
- `guildId` (String) — Discord guild ID

## Non-Obvious Constraints

- **Rating is a string**, not a number. Display logic using `.repeat()` assumes numeric value — keep that in mind if adding rating validation.
- **Image re-upload:** on `/review create`, if user attaches a file, the bot fetches it from Discord's CDN and re-sends it to the channel, storing the new CDN URL. The URL field and file attachment are handled via a timeout race — first to resolve wins.
- **Guild-scoped in bot, not in API:** bot list/search queries filter by `guildId`; API routes return across all guilds.
- **Slash commands deploy guild-only** (to `GUILD_ID`) — not global. Change `deploy-commands.ts` to use `rest.put(Routes.applicationCommands(...))` for global deployment.

## Environment Variables

Required in `.env` at repo root (shared by bot and API via `dotenv`):

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Application ID from Discord Developer Portal |
| `GUILD_ID` | Test server ID (slash commands deploy here) |
| `DATABASE_URL` | SQLite path, default `file:./dev.db` |
| `PREFIX` | Prefix for prefix commands, default `!` |
| `API_PORT` | Express API port, default `3001` |
| `DISCORD_CLIENT_SECRET` | App secret, used by API auth route for OAuth2 exchange |
