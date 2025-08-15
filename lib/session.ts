import type { IronSessionOptions } from 'iron-session';

export const sessionOptions = (): IronSessionOptions => {
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

export type SessionData = { ghAccessToken?: string };

export type SessionFacade = {
  githubToken?: string;
  destroy: () => Promise<void>;
  save: () => Promise<void>;
};

export async function getSession(req: any, res: any): Promise<SessionFacade> {
  // テスト環境では iron-session を使わず、可能なら req.session を透過
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    const raw = req?.session ?? {};
    return {
      githubToken: raw.ghAccessToken,
      destroy: async () => {
        if (typeof raw.destroy === 'function') {
          await raw.destroy();
        }
      },
      save: async () => {
        if (typeof raw.save === 'function') {
          await raw.save();
        }
      },
    };
  }
  // 実行時に動的 import（Jest の ESM 取り扱い回避）
  const mod = await import('iron-session');
  const raw = await mod.getIronSession(req, res, sessionOptions());
  return {
    githubToken: raw.ghAccessToken,
    destroy: () => raw.destroy(),
    save: () => raw.save(),
  };
}
