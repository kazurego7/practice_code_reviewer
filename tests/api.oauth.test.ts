import loginHandler from '../pages/api/auth/login';
import callbackHandler from '../pages/api/auth/callback';
import { createMocks } from 'node-mocks-http';

describe('GitHub OAuth flow', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV, GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 'secret', GITHUB_REDIRECT_URI: 'http://localhost/callback' };
  });
  afterEach(() => {
    process.env = OLD_ENV;
    jest.resetAllMocks();
  });

  it('redirects to GitHub and exchanges code for token', async () => {
    const { req: loginReq, res: loginRes } = createMocks({ method: 'GET' });
    await loginHandler(loginReq as any, loginRes as any);
    expect(loginRes._getStatusCode()).toBe(302);
    const redirectUrl = loginRes._getHeaders().location as string;
    expect(redirectUrl).toContain('client_id=id');
    expect(redirectUrl).toContain('scope=public_repo');

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'token' })
    });
    (global as any).fetch = mockFetch;

    const { req: cbReq, res: cbRes } = createMocks({ method: 'GET', query: { code: 'abc' } });
    await callbackHandler(cbReq as any, cbRes as any);

    expect(mockFetch).toHaveBeenCalledWith('https://github.com/login/oauth/access_token', expect.any(Object));
    expect(cbRes._getStatusCode()).toBe(200);
    expect(cbRes._getJSONData()).toEqual({ access_token: 'token' });
  });
});
