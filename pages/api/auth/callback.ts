import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { callbackHandler } from '@/lib/handlers/auth';

export { callbackHandler };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // セッションを用意してハンドラに委譲
  req.session = await getIronSession(req, res, sessionOptions());
  return callbackHandler(req, res);
}
