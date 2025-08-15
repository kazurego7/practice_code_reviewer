import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'OAuth client not configured' });
    return;
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    res.status(500).json({ error: text });
    return;
  }

  const data = await tokenRes.json();
  res.status(200).json({ access_token: data.access_token });
}
