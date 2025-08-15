import handler from '../pages/api/review';
import { createMocks } from 'node-mocks-http';

describe('POST /api/review', () => {
  it('returns 401 when unauthenticated', async () => {
    const { req, res } = createMocks({ method: 'POST' });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 405 on GET', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()['allow']).toBe('POST');
  });

  it('returns 400 on invalid pr_url', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    (req as any).session = { ghAccessToken: 'tok' };
    req.body = { pr_url: 'not-a-url' };
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('returns 413 when diff is too large', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    (req as any).session = { ghAccessToken: 'tok' };
    req.body = { pr_url: 'https://github.com/owner/repo/pull/123' };

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'A'.repeat(200_001),
    });

    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(413);
  });

  it('returns 200 and result on small diff', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    (req as any).session = { ghAccessToken: 'tok' };
    req.body = { pr_url: 'https://github.com/owner/repo/pull/456' };

    const diff = [
      'diff --git a/a.txt b/a.txt',
      '--- a/a.txt',
      '+++ b/a.txt',
      '+added line',
      '-removed line',
    ].join('\n');

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => diff,
    });

    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.model).toBe('gpt-5');
    expect(Array.isArray(data.result)).toBe(true);
  });
});
