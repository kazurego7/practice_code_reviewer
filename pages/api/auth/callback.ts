import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { callbackHandler } from '@/lib/handlers/auth';

export { callbackHandler };
export default async function handler(req: any, res: any) {
  // セッションを用意してハンドラに委譲
  // @ts-expect-error: attach for downstream handlers
  req.session = await getIronSession(req, res, sessionOptions());
  return callbackHandler(req, res);
}
