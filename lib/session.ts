import type { SessionOptions, IronSessionData, IronSession } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';

export const sessionOptions = (): SessionOptions => {
  const password = process.env.IRON_SESSION_PASSWORD;
  if (!password) {
    throw new Error('IRON_SESSION_PASSWORD が未設定です (.env.local を確認)');
  }
  return {
    cookieName: 'auth_session',
    password,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  };
};

export type SessionData = IronSessionData & { ghAccessToken?: string };

export type SessionFacade = {
  githubToken?: string;
  destroy: () => Promise<void>;
  save: () => Promise<void>;
};

export async function getSession(req: NextApiRequest, res: NextApiResponse): Promise<SessionFacade> {
  // テスト環境では iron-session を使わず、可能なら req.session を透過
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    const raw = (req.session as IronSession<SessionData> | undefined) ?? ({} as IronSession<SessionData>);
    return {
      githubToken: raw.ghAccessToken,
      destroy: async () => {
        if (typeof (raw as IronSession<SessionData>).destroy === 'function') {
          await (raw as IronSession<SessionData>).destroy();
        }
      },
      save: async () => {
        if (typeof (raw as IronSession<SessionData>).save === 'function') {
          await (raw as IronSession<SessionData>).save();
        }
      },
    };
  }
  // 実行時に動的 import（Jest の ESM 取り扱い回避）
  const mod = await import('iron-session');
  const raw = await mod.getIronSession<SessionData>(req, res, sessionOptions());
  return {
    githubToken: raw.ghAccessToken,
    destroy: async () => {
      await raw.destroy();
    },
    save: async () => {
      await raw.save();
    },
  };
}
