import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'GITHUB_CLIENT_ID is not set' });
    return;
  }

  const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
  const scope = 'public_repo';
  const url =
    `https://github.com/login/oauth/authorize?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}`;

  res.writeHead(302, { Location: url });
  res.end();
}
