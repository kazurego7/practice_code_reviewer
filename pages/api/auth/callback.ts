import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

export default async function callback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }
  const session = await getSession(req, res);
  if (!session.oauthState || state !== session.oauthState) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured' });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${(req.headers['x-forwarded-proto'] as string) || 'http'}://${req.headers.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    state,
  });

  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return res.status(502).json({ error: 'Token exchange failed', detail: text });
  }

  const json = (await resp.json()) as { access_token?: string; error?: string };
  if (!json.access_token) {
    return res.status(502).json({ error: 'No access token', detail: json });
  }

  session.githubToken = json.access_token;
  delete session.oauthState;
  await session.save();

  return res.redirect('/');
}
