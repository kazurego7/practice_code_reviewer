import { createMocks } from 'node-mocks-http';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      responses: {
        create: jest.fn().mockResolvedValue({
          output_text: '- Improve logging\n- Add tests',
        }),
      },
    })),
  };
});

import handler, { MAX_DIFF_CHARS } from '../pages/api/review';

describe('POST /api/review', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'diff content',
    });
  });

  it('OpenAI の指摘を issues 配列として返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { pr_url: 'https://github.com/a/b/pull/1' },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      issues: [
        { message: 'Improve logging' },
        { message: 'Add tests' },
      ],
    });
  });

  it('diff が上限を超える場合は 413 を返す', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => 'a'.repeat(MAX_DIFF_CHARS + 1),
    });
    const { req, res } = createMocks({
      method: 'POST',
      body: { pr_url: 'https://github.com/a/b/pull/1' },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(413);
  });
});
