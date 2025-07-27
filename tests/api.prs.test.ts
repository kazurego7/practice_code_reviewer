import handler from '../pages/api/prs';
import { createMocks } from 'node-mocks-http';

describe('GET /api/prs', () => {
  it('returns mock pull requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { owner: 'test', repo: 'repo' }
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data.prs)).toBe(true);
    expect(data.prs.length).toBeGreaterThan(0);
  });
});
