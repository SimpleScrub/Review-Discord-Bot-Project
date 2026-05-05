import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/token
// Exchanges Discord OAuth2 code for access_token (called by the Activity client)
router.post('/token', async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Discord token exchange failed:', err);
    res.status(502).json({ error: 'Token exchange failed' });
    return;
  }

  const data = await tokenRes.json() as { access_token: string };
  res.json({ access_token: data.access_token });
});

export default router;
