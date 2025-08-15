import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

export default async function logout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const session = await getSession(req, res);
  await session.destroy();
  return res.status(200).json({ ok: true });
}
