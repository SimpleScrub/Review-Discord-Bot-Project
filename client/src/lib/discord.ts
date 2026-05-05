import { DiscordSDK } from '@discord/embedded-app-sdk';

export const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

export type AuthUser = {
  id: string;
  username: string;
  avatar: string | null;
  guildId: string | null | undefined;
};

function isInsideDiscord(): boolean {
  // Discord injects instance_id into the iframe URL
  return new URLSearchParams(window.location.search).has('instance_id');
}

export async function initDiscord(): Promise<AuthUser | null> {
  if (!isInsideDiscord()) return null;

  await discordSdk.ready();

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  const tokenRes = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!tokenRes.ok) throw new Error('Token exchange failed');
  const { access_token } = await tokenRes.json();

  const auth = await discordSdk.commands.authenticate({ access_token });

  return {
    id: auth.user.id,
    username: auth.user.username,
    avatar: auth.user.avatar,
    guildId: discordSdk.guildId,
  };
}
