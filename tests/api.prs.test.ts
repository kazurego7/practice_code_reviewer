import handler from '../pages/api/prs';
import { createMocks } from 'node-mocks-http';

describe('GET /api/prs', () => {
  it('returns 401 when unauthenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { owner: 'test', repo: 'repo' },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    const data = res._getJSONData();
    expect(data.error).toBe('Unauthorized');
  });
});
