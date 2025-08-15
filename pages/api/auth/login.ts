import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { loginHandler } from '@/lib/handlers/auth';

export { loginHandler };
export default async function handler(req: any, res: any) {
  // iron-session を初期化（login では未使用だが統一）
  // @ts-expect-error: attach for downstream handlers
  req.session = await getIronSession(req, res, sessionOptions());
  return loginHandler(req, res);
}
