import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'node:crypto';
import { getSession } from '@/lib/session';

export default async function login(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured' });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${(req.headers['x-forwarded-proto'] as string) || 'http'}://${req.headers.host}`;

  const state = crypto.randomBytes(16).toString('hex');
  const session = await getSession(req, res);
  session.oauthState = state;
  await session.save();

  const redirectUri = `${baseUrl}/api/auth/callback`;
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'public_repo');
  authorize.searchParams.set('state', state);

  return res.redirect(authorize.toString());
}
