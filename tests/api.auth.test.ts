import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { loginHandler, sessionHandler, callbackHandler } from '@/lib/handlers/auth';

describe('API Auth', () => {
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

  test('GET /api/auth/login redirects to GitHub authorize', async () => {
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

  test('GET /api/auth/session returns authenticated=false when no token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    // @ts-expect-error: test injection
    req.session = {};

    await sessionHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData() as string);
    expect(json.authenticated).toBe(false);
  });

  test('GET /api/auth/callback saves token and redirects', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { code: 'abc' },
      headers: { host: 'localhost:3000' },
    });
    const save = jest.fn();
    // @ts-expect-error: test injection
    req.session = { save };

    // mock GitHub token exchange
    // @ts-expect-error: inject fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok_123' }),
    });

    await callbackHandler(req, res);

    expect(global.fetch).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(302);
    expect(res._getHeaders()['location']).toBe('/');
  });
});
