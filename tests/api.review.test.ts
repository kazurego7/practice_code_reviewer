import handler from '../pages/api/review';
import { createMocks } from 'node-mocks-http';

describe('POST /api/review', () => {
  it('returns ok', async () => {
    const { req, res } = createMocks({ method: 'POST' });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });
});
