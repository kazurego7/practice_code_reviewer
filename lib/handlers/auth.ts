import type { NextApiRequest, NextApiResponse } from 'next';

export function getBaseUrl(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http';
  const host = req.headers.host ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID が未設定です' });
  }

  const redirectUri = `${getBaseUrl(req)}/api/auth/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'public_repo');

  res.status(302).setHeader('Location', url.toString());
  return res.end();
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<string> {
  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });
  if (!resp.ok) {
    throw new Error(`GitHub token exchange failed: ${resp.status}`);
  }
  const data = (await resp.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GitHub token missing: ${data.error ?? 'unknown_error'}`);
  }
  return data.access_token;
}

export async function callbackHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).json({ error: 'code がありません' });
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .json({ error: 'GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET が未設定です' });
  }
  const redirectUri = `${getBaseUrl(req)}/api/auth/callback`;
  try {
    const token = await exchangeCodeForToken({ clientId, clientSecret, code, redirectUri });
    // @ts-expect-error: iron-session で拡張される想定
    req.session = req.session || {};
    // @ts-expect-error: iron-session で拡張される想定
    req.session.ghAccessToken = token;
    // @ts-expect-error: iron-session で拡張される想定
    if (typeof req.session.save === 'function') {
      // @ts-expect-error
      await req.session.save();
    }
    res.status(302).setHeader('Location', '/');
    return res.end();
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'callback error' });
  }
}

export async function sessionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }
  // @ts-expect-error: iron-session により拡張
  const authenticated = Boolean(req.session?.ghAccessToken);
  return res.status(200).json({ authenticated });
}

