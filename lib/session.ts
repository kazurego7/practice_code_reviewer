import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import type { SessionOptions } from 'iron-session';

export type AppSession = {
  githubToken?: string;
  oauthState?: string;
};

export const sessionOptions: SessionOptions = {
  cookieName: 'code-reviewer.session',
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
};

export async function getSession(
  req: NextApiRequest | Request,
  res: NextApiResponse | Response
) {
  return getIronSession<AppSession>(req as any, res as any, sessionOptions);
}
