import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { loginHandler, sessionHandler, callbackHandler } from '@/lib/handlers/auth';
import type { IronSession, IronSessionData } from 'iron-session';

// IronSession 互換のセッションモックを生成
const makeSessionMock = (overrides: Partial<IronSessionData> & {
  save?: () => Promise<void>;
  destroy?: () => void;
  updateConfig?: () => void;
} = {}): IronSession<IronSessionData> => {
  const save = overrides.save ?? (async () => {});
  const destroy = overrides.destroy ?? (() => {});
  const updateConfig = overrides.updateConfig ?? (() => {});
  return {
    ...overrides,
    save,
    destroy,
    updateConfig,
  } as unknown as IronSession<IronSessionData>;
};

describe('API 認証', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.IRON_SESSION_PASSWORD = 'a'.repeat(32);
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('GET /api/auth/login へのアクセスで GitHub 認可画面へリダイレクトされる', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { host: 'localhost:3000' },
    });

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(302);
    const loc = res._getHeaders()['location'] as string;
    expect(loc).toContain('https://github.com/login/oauth/authorize');
    expect(loc).toContain('client_id=test-client-id');
    expect(loc).toContain('scope=public_repo');
    expect(loc).toContain(encodeURIComponent('http://localhost:3000/api/auth/callback'));
  });

  test('トークン未設定なら GET /api/auth/session は authenticated=false を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    req.session = makeSessionMock();

    await sessionHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData() as string);
    expect(json.authenticated).toBe(false);
  });

  test('GET /api/auth/callback はトークンを保存しトップへリダイレクトする', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { code: 'abc' },
      headers: { host: 'localhost:3000' },
    });
    const save = jest.fn(async () => {});
    req.session = makeSessionMock({ save });

    // mock GitHub token exchange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok_123' }),
    });

    await callbackHandler(req, res);

    expect(global.fetch).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(req.session.ghAccessToken).toBe('tok_123');
    expect(res._getStatusCode()).toBe(302);
    expect(res._getHeaders()['location']).toBe('/');
  });

  // --- Guards & error paths ---

  test('POST /api/auth/login は 405 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await loginHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()['allow']).toBe('GET');
  });

  test('GITHUB_CLIENT_ID 未設定時は GET /api/auth/login が 500 を返す', async () => {
    delete process.env.GITHUB_CLIENT_ID;
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await loginHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    const json = JSON.parse(res._getData() as string);
    expect(json.error).toContain('GITHUB_CLIENT_ID');
  });

  test('POST /api/auth/callback は 405 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await callbackHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()['allow']).toBe('GET');
  });

  test('code が無いと GET /api/auth/callback は 400 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await callbackHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData() as string);
    expect(json.error).toContain('code');
  });

  test('認証環境変数が無いと GET /api/auth/callback は 500 を返す', async () => {
    delete process.env.GITHUB_CLIENT_SECRET;
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { code: 'abc' },
    });
    await callbackHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    const json = JSON.parse(res._getData() as string);
    expect(json.error).toContain('GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET');
  });

  test('GitHub トークン交換が失敗すると GET /api/auth/callback は 500 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { code: 'abc' },
      headers: { host: 'localhost:3000' },
    });
    req.session = makeSessionMock({ save: jest.fn(async () => {}) });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await callbackHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    const json = JSON.parse(res._getData() as string);
    expect(json.error).toContain('GitHub token exchange failed');
  });

  test('access_token が無いと GET /api/auth/callback は 500 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { code: 'abc' },
      headers: { host: 'localhost:3000' },
    });
    req.session = makeSessionMock({ save: jest.fn(async () => {}) });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'bad_things' }),
    });

    await callbackHandler(req, res);
    expect(res._getStatusCode()).toBe(500);
    const json = JSON.parse(res._getData() as string);
    expect(json.error).toContain('GitHub token missing');
  });

  test('POST /api/auth/session は 405 を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await sessionHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()['allow']).toBe('GET');
  });

  test('トークンありなら GET /api/auth/session は authenticated=true を返す', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    req.session = makeSessionMock({ ghAccessToken: 'tok' });
    await sessionHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData() as string);
    expect(json.authenticated).toBe(true);
  });
});
